const { google } = require('googleapis');

// Simple in-memory storage for demo/development
// In production, you'd use a proper database like Supabase, PlanetScale, etc.
let activeSequences = [];
let executionSchedules = new Map(); // Map to track scheduled executions

// Import active sequences from sequences.js function
const sequencesHandler = require('./sequences');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check authentication
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authorization required' }),
    };
  }

  const accessToken = authHeader.substring(7);

  try {
    const path = event.path.replace('/.netlify/functions/sequence-executor', '');
    const method = event.httpMethod;

    console.log(`Sequence Executor: ${method} ${path}`);

    // GET /execution/check - Check for scheduled executions and process them
    if (method === 'GET' && path === '/check') {
      const results = await processScheduledExecutions(accessToken);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          processed: results.processed,
          errors: results.errors,
          message: `Processed ${results.processed} scheduled executions`
        }),
      };
    }

    // POST /execution/process/:activeSequenceId - Process next step for active sequence
    if (method === 'POST' && path.match(/^\/process\/\d+$/)) {
      const activeSequenceId = parseInt(path.split('/')[2]);
      
      // Get the active sequence from sequences.js storage
      const mockEvent = {
        httpMethod: 'GET',
        path: '/.netlify/functions/sequences/active',
        headers: event.headers
      };
      
      const activeSequencesResponse = await sequencesHandler.handler(mockEvent, context);
      const activeSequencesData = JSON.parse(activeSequencesResponse.body);
      
      const activeSequence = activeSequencesData.activeSequences?.find(seq => seq.id === activeSequenceId);
      
      if (!activeSequence) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Active sequence not found' }),
        };
      }

      if (activeSequence.status !== 'active') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Sequence is not active' }),
        };
      }

      const result = await processNextSequenceStep(accessToken, activeSequence);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // GET /execution/schedule - Get all scheduled executions
    if (method === 'GET' && path === '/schedule') {
      const scheduled = Array.from(executionSchedules.entries()).map(([id, schedule]) => ({
        activeSequenceId: id,
        nextExecutionTime: schedule.nextExecutionTime,
        currentStep: schedule.currentStep,
        totalSteps: schedule.totalSteps,
        status: schedule.status
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ scheduledExecutions: scheduled }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error) {
    console.error('Sequence executor error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Process scheduled executions - should be called periodically
async function processScheduledExecutions(accessToken) {
  const now = new Date();
  const results = { processed: 0, errors: [] };

  console.log(`🔄 Checking scheduled executions at ${now.toISOString()}`);

  // Get all active sequences that need processing
  for (const [activeSequenceId, schedule] of executionSchedules.entries()) {
    try {
      if (schedule.status === 'active' && new Date(schedule.nextExecutionTime) <= now) {
        console.log(`⏰ Processing scheduled execution for sequence ${activeSequenceId}`);
        
        // Get the active sequence details
        const mockEvent = {
          httpMethod: 'GET',
          path: '/.netlify/functions/sequences/active',
          headers: { authorization: `Bearer ${accessToken}` }
        };
        
        const activeSequencesResponse = await sequencesHandler.handler(mockEvent, {});
        const activeSequencesData = JSON.parse(activeSequencesResponse.body);
        
        const activeSequence = activeSequencesData.activeSequences?.find(seq => seq.id === activeSequenceId);
        
        if (activeSequence && activeSequence.status === 'active') {
          await processNextSequenceStep(accessToken, activeSequence);
          results.processed++;
        } else {
          // Remove from schedule if sequence no longer active
          executionSchedules.delete(activeSequenceId);
        }
      }
    } catch (error) {
      console.error(`Error processing sequence ${activeSequenceId}:`, error);
      results.errors.push({
        activeSequenceId,
        error: error.message
      });
    }
  }

  return results;
}

// Process the next step in a sequence
async function processNextSequenceStep(accessToken, activeSequence) {
  try {
    console.log(`🔄 Processing next step for sequence ${activeSequence.id}, current step: ${activeSequence.current_step}`);

    // Get the sequence definition to find the next step
    const mockEvent = {
      httpMethod: 'GET',
      path: '/.netlify/functions/sequences',
      headers: { authorization: `Bearer ${accessToken}` }
    };
    
    const sequencesResponse = await sequencesHandler.handler(mockEvent, {});
    const sequencesData = JSON.parse(sequencesResponse.body);
    
    const sequence = sequencesData.sequences?.find(seq => seq.id === activeSequence.sequence_id);
    
    if (!sequence) {
      throw new Error('Sequence definition not found');
    }

    // Find the next step to send
    const nextStepIndex = activeSequence.current_step; // current_step is 0-based for next step
    const nextStep = sequence.steps[nextStepIndex];

    if (!nextStep) {
      // Sequence completed
      await completeSequence(accessToken, activeSequence);
      return {
        success: true,
        message: 'Sequence completed',
        status: 'completed'
      };
    }

    // Send the email for this step
    const emailResult = await sendSequenceEmail(accessToken, activeSequence, nextStep);

    // Update the active sequence
    await updateActiveSequenceProgress(accessToken, activeSequence, nextStep, sequence.steps);

    return {
      success: true,
      message: `Step ${nextStep.step_order} sent successfully`,
      emailId: emailResult.messageId,
      nextStep: nextStepIndex + 1,
      totalSteps: sequence.steps.length,
      nextSendAt: activeSequence.next_send_at
    };

  } catch (error) {
    console.error('Error processing sequence step:', error);
    
    // Mark sequence as failed
    await markSequenceAsFailed(accessToken, activeSequence, error.message);
    
    throw error;
  }
}

// Send sequence email
async function sendSequenceEmail(accessToken, activeSequence, step) {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Substitute variables in subject and content
    const subject = substituteVariables(step.subject, activeSequence.variables);
    const content = substituteVariables(step.content, activeSequence.variables);

    // Create email message
    const messageParts = [
      `To: ${activeSequence.prospect_email}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      content,
    ];

    const message = messageParts.join('\n');

    // Encode message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send message
    const sendParams = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    };

    // Add thread ID if available
    if (activeSequence.email_thread_id) {
      sendParams.requestBody.threadId = activeSequence.email_thread_id;
    }

    const response = await gmail.users.messages.send(sendParams);

    console.log(`📧 Sequence email sent: ${response.data.id} to ${activeSequence.prospect_email}`);
    
    return {
      messageId: response.data.id,
      threadId: response.data.threadId,
      subject,
      to: activeSequence.prospect_email
    };

  } catch (error) {
    console.error('Error sending sequence email:', error);
    throw error;
  }
}

// Update active sequence progress
async function updateActiveSequenceProgress(accessToken, activeSequence, completedStep, allSteps) {
  try {
    const nextStepIndex = activeSequence.current_step + 1;
    const isCompleted = nextStepIndex >= allSteps.length;
    
    // Calculate next send time if there are more steps
    let nextSendTime = null;
    if (!isCompleted) {
      const nextStep = allSteps[nextStepIndex];
      // Ensure minimum delay of 1 minute for 0 delay_hours to prevent simultaneous sends
      const delayMs = nextStep.delay_hours > 0 
        ? nextStep.delay_hours * 60 * 60 * 1000 
        : 60 * 1000; // 1 minute minimum
      nextSendTime = new Date(Date.now() + delayMs).toISOString();
    }

    // Update active sequence (this would normally update the database)
    activeSequence.current_step = nextStepIndex;
    activeSequence.steps_completed = nextStepIndex;
    activeSequence.next_send_at = nextSendTime;
    
    if (isCompleted) {
      activeSequence.status = 'completed';
      activeSequence.completed_at = new Date().toISOString();
      // Remove from execution schedule
      executionSchedules.delete(activeSequence.id);
    } else {
      // Update execution schedule
      executionSchedules.set(activeSequence.id, {
        nextExecutionTime: nextSendTime,
        currentStep: nextStepIndex,
        totalSteps: allSteps.length,
        status: 'active'
      });
    }

    console.log(`✅ Updated sequence ${activeSequence.id}: step ${nextStepIndex}/${allSteps.length}`);

  } catch (error) {
    console.error('Error updating sequence progress:', error);
    throw error;
  }
}

// Complete sequence
async function completeSequence(accessToken, activeSequence) {
  try {
    activeSequence.status = 'completed';
    activeSequence.completed_at = new Date().toISOString();
    activeSequence.next_send_at = null;
    
    // Remove from execution schedule
    executionSchedules.delete(activeSequence.id);
    
    console.log(`🎉 Sequence ${activeSequence.id} completed successfully`);
    
  } catch (error) {
    console.error('Error completing sequence:', error);
    throw error;
  }
}

// Mark sequence as failed
async function markSequenceAsFailed(accessToken, activeSequence, errorMessage) {
  try {
    activeSequence.status = 'failed';
    activeSequence.error = errorMessage;
    activeSequence.failed_at = new Date().toISOString();
    
    // Remove from execution schedule
    executionSchedules.delete(activeSequence.id);
    
    console.log(`❌ Sequence ${activeSequence.id} marked as failed: ${errorMessage}`);
    
  } catch (error) {
    console.error('Error marking sequence as failed:', error);
  }
}

// Helper function to substitute variables
function substituteVariables(text, variables = {}) {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const key = variable.trim();
    return variables[key] || match;
  });
}

// Initialize execution schedules from active sequences on startup
async function initializeExecutionSchedules() {
  // This would be called on cold starts to rebuild the schedule from persistent storage
  console.log('🚀 Initializing sequence execution schedules');
}

// Auto-initialize on cold start
initializeExecutionSchedules();