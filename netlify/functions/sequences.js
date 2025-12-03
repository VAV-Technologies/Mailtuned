const { google } = require('googleapis');

// Simple in-memory storage for demo/development
// In production, you'd use a proper database like Supabase, PlanetScale, etc.
let sequences = [
  {
    id: 1,
    name: 'Welcome Sequence',
    description: 'Welcome new prospects and introduce your services',
    steps: [
      {
        id: 1,
        step_order: 1,
        subject: 'Welcome {{prospectName}}! Let\'s discuss {{businessActivity}}',
        content: 'Hi {{prospectName}},\n\nThank you for your interest! I noticed you work in {{businessActivity}}.\n\nI\'d love to discuss how we can help you achieve your goals.\n\nBest regards,\nYour Name',
        delay_hours: 0
      },
      {
        id: 2,
        step_order: 2,
        subject: 'Quick follow-up on {{businessActivity}}',
        content: 'Hi {{prospectName}},\n\nI wanted to follow up on my previous email about {{businessActivity}}.\n\nDo you have 15 minutes this week for a quick call?\n\nBest regards,\nYour Name',
        delay_hours: 48
      }
    ],
    is_active: 1,
    step_count: 2,
    active_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let activeSequences = [];
let sequenceIdCounter = 2;
let activeSequenceIdCounter = 1;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check authentication (allow system token for internal calls)
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authorization required' }),
    };
  }

  const token = authHeader.substring(7);
  const isSystemCall = token === 'system';

  const accessToken = authHeader.substring(7);

  try {
    const path = event.path.replace('/.netlify/functions/sequences', '');
    const method = event.httpMethod;

    console.log(`Sequences API: ${method} ${path}`);

    // GET /sequences - Get all sequences
    if (method === 'GET' && path === '') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sequences }),
      };
    }

    // GET /sequences/active - Get active sequences
    if (method === 'GET' && path === '/active') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ activeSequences }),
      };
    }

    // POST /sequences - Create new sequence
    if (method === 'POST' && path === '') {
      const sequenceData = JSON.parse(event.body);
      
      // Validate required fields
      if (!sequenceData.name || !sequenceData.steps || sequenceData.steps.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name and steps are required' }),
        };
      }

      // Add IDs and order to steps
      const stepsWithIds = sequenceData.steps.map((step, index) => ({
        id: Date.now() + index,
        step_order: index + 1,
        subject: step.subject,
        content: step.content,
        delay_hours: step.delay_hours || 0
      }));

      const newSequence = {
        id: sequenceIdCounter++,
        name: sequenceData.name,
        description: sequenceData.description || '',
        steps: stepsWithIds,
        is_active: sequenceData.is_active ? 1 : 0,
        step_count: stepsWithIds.length,
        active_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      sequences.push(newSequence);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ sequence: newSequence }),
      };
    }

    // PUT /sequences/:id - Update sequence
    if (method === 'PUT' && path.match(/^\/\d+$/)) {
      const sequenceId = parseInt(path.substring(1));
      const sequenceData = JSON.parse(event.body);
      
      const sequenceIndex = sequences.findIndex(seq => seq.id === sequenceId);
      if (sequenceIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Sequence not found' }),
        };
      }

      // Update steps with proper IDs and order
      const stepsWithIds = sequenceData.steps.map((step, index) => ({
        id: step.id || Date.now() + index,
        step_order: index + 1,
        subject: step.subject,
        content: step.content,
        delay_hours: step.delay_hours || 0
      }));

      // Update sequence
      const updatedSequence = {
        ...sequences[sequenceIndex],
        name: sequenceData.name,
        description: sequenceData.description || '',
        steps: stepsWithIds,
        is_active: sequenceData.is_active ? 1 : 0,
        step_count: stepsWithIds.length,
        updated_at: new Date().toISOString(),
      };

      sequences[sequenceIndex] = updatedSequence;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sequence: updatedSequence }),
      };
    }

    // DELETE /sequences/:id - Delete sequence
    if (method === 'DELETE' && path.match(/^\/\d+$/)) {
      const sequenceId = parseInt(path.substring(1));
      
      const sequenceIndex = sequences.findIndex(seq => seq.id === sequenceId);
      if (sequenceIndex === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Sequence not found' }),
        };
      }

      // Check if sequence has active executions
      const hasActiveExecutions = activeSequences.some(active => active.sequence_id === sequenceId);
      if (hasActiveExecutions) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Cannot delete sequence with active executions' }),
        };
      }

      sequences.splice(sequenceIndex, 1);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    // POST /sequences/:id/activate - Activate sequence for prospect
    if (method === 'POST' && path.match(/^\/\d+\/activate$/)) {
      const sequenceId = parseInt(path.split('/')[1]);
      const prospectData = JSON.parse(event.body);
      
      const sequence = sequences.find(seq => seq.id === sequenceId);
      if (!sequence) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Sequence not found' }),
        };
      }

      if (!sequence.is_active) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Sequence is not active' }),
        };
      }

      // Validate prospect data
      const { prospectName, prospectEmail, businessActivity, emailThreadId } = prospectData;
      if (!prospectName || !prospectEmail || !businessActivity || !emailThreadId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'All prospect information is required' }),
        };
      }

      // Create active sequence execution
      const activeSequence = {
        id: activeSequenceIdCounter++,
        sequence_id: sequenceId,
        sequence_name: sequence.name,
        prospect_name: prospectName,
        prospect_email: prospectEmail,
        business_activity: businessActivity,
        email_thread_id: emailThreadId,
        current_step: 0,
        status: 'active',
        started_at: new Date().toISOString(),
        next_send_at: new Date().toISOString(), // First email sends immediately
        variables: {
          prospectName,
          businessActivity,
          ...prospectData.variables
        },
        steps_completed: 0,
        total_steps: sequence.steps.length
      };

      activeSequences.push(activeSequence);

      // Update sequence active count
      const sequenceIndex = sequences.findIndex(seq => seq.id === sequenceId);
      if (sequenceIndex !== -1) {
        sequences[sequenceIndex].active_count = (sequences[sequenceIndex].active_count || 0) + 1;
      }

      // Immediately send the first email (skip for system calls)
      try {
        if (!isSystemCall) {
          await sendSequenceEmail(accessToken, activeSequence, sequence.steps[0]);
        }
        
        // Update active sequence after sending first email
        activeSequence.current_step = 1;
        activeSequence.steps_completed = 1;
        
        // Schedule next email if there are more steps
        if (sequence.steps.length > 1) {
          const nextStep = sequence.steps[1];
          // Ensure minimum delay of 1 minute for 0 delay_hours to prevent simultaneous sends
          const delayMs = nextStep.delay_hours > 0 
            ? nextStep.delay_hours * 60 * 60 * 1000 
            : 60 * 1000; // 1 minute minimum
          const nextSendTime = new Date(Date.now() + delayMs);
          activeSequence.next_send_at = nextSendTime.toISOString();
          
          // Add to cron scheduler if not a system call
          if (!isSystemCall) {
            try {
              await scheduleSequenceExecution(activeSequence.id, nextSendTime, 1, sequence.steps.length);
            } catch (cronError) {
              console.error('Error scheduling sequence:', cronError);
              // Continue without scheduling - sequence can still be activated manually
            }
          }
        } else {
          // Sequence completed
          activeSequence.status = 'completed';
          activeSequence.completed_at = new Date().toISOString();
          activeSequence.next_send_at = null;
        }

      } catch (emailError) {
        console.error('Error sending first email:', emailError);
        // Mark as failed but still create the active sequence
        activeSequence.status = 'failed';
        activeSequence.error = emailError.message;
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true,
          activeSequence,
          message: 'Sequence activated and first email sent'
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error) {
    console.error('Sequences error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Helper function to send sequence emails
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

    console.log(`Sequence email sent: ${response.data.id} to ${activeSequence.prospect_email}`);
    
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

// Helper function to substitute variables
function substituteVariables(text, variables = {}) {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const key = variable.trim();
    return variables[key] || match;
  });
}

// Helper function to schedule sequence execution
async function scheduleSequenceExecution(activeSequenceId, nextExecution, currentStep, totalSteps) {
  try {
    const cronUrl = process.env.URL || 'http://localhost:8888';
    const addUrl = `${cronUrl}/.netlify/functions/sequence-cron/add`;

    const response = await fetch(addUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activeSequenceId,
        nextExecution: nextExecution.toISOString(),
        currentStep,
        totalSteps
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule sequence: ${response.status}`);
    }

    console.log(`📅 Scheduled sequence ${activeSequenceId} for ${nextExecution.toISOString()}`);
    
  } catch (error) {
    console.error('Error scheduling sequence execution:', error);
    throw error;
  }
}