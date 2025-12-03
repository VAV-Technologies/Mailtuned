const cron = require('node-cron');

// Simple background scheduler that runs in serverless environment
// Note: This approach has limitations in serverless - for production use external cron services
let isSchedulerRunning = false;
let schedulerInterval = null;

// Store for active sequence schedules
let executionQueue = new Map();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/sequence-cron', '');
  const method = event.httpMethod;

  try {
    // GET /status - Get scheduler status
    if (method === 'GET' && path === '/status') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          isRunning: isSchedulerRunning,
          queueSize: executionQueue.size,
          nextExecutions: Array.from(executionQueue.entries()).map(([id, data]) => ({
            activeSequenceId: id,
            nextExecution: data.nextExecution,
            currentStep: data.currentStep
          }))
        }),
      };
    }

    // POST /start - Start the scheduler
    if (method === 'POST' && path === '/start') {
      if (!isSchedulerRunning) {
        startScheduler();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Scheduler started', isRunning: true }),
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Scheduler already running', isRunning: true }),
        };
      }
    }

    // POST /stop - Stop the scheduler
    if (method === 'POST' && path === '/stop') {
      if (isSchedulerRunning) {
        stopScheduler();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Scheduler stopped', isRunning: false }),
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Scheduler not running', isRunning: false }),
        };
      }
    }

    // POST /add - Add sequence to execution queue
    if (method === 'POST' && path === '/add') {
      const { activeSequenceId, nextExecution, currentStep, totalSteps } = JSON.parse(event.body);
      
      executionQueue.set(activeSequenceId, {
        nextExecution: new Date(nextExecution),
        currentStep: currentStep || 0,
        totalSteps: totalSteps || 1,
        status: 'scheduled'
      });

      // Start scheduler if not running
      if (!isSchedulerRunning) {
        startScheduler();
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Sequence added to execution queue',
          activeSequenceId,
          nextExecution
        }),
      };
    }

    // POST /remove - Remove sequence from execution queue
    if (method === 'POST' && path === '/remove') {
      const { activeSequenceId } = JSON.parse(event.body);
      
      const removed = executionQueue.delete(parseInt(activeSequenceId));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: removed ? 'Sequence removed from queue' : 'Sequence not found in queue',
          removed
        }),
      };
    }

    // POST /process - Manually trigger processing
    if (method === 'POST' && path === '/process') {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization required' }),
        };
      }

      const result = await processScheduledSequences(authHeader.substring(7));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };

  } catch (error) {
    console.error('Sequence cron error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Start the scheduler
function startScheduler() {
  if (isSchedulerRunning) return;

  console.log('🚀 Starting sequence scheduler');
  isSchedulerRunning = true;

  // Run every minute to check for scheduled executions
  schedulerInterval = setInterval(async () => {
    try {
      console.log('🔄 Checking scheduled sequences...');
      await processScheduledSequences('system'); // Use system token for internal processing
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  }, 60000); // Check every minute

  console.log('✅ Sequence scheduler started');
}

// Stop the scheduler
function stopScheduler() {
  if (!isSchedulerRunning) return;

  console.log('🛑 Stopping sequence scheduler');
  
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  
  isSchedulerRunning = false;
  console.log('✅ Sequence scheduler stopped');
}

// Process scheduled sequences
async function processScheduledSequences(accessToken) {
  const now = new Date();
  const results = { processed: 0, errors: [], skipped: 0 };

  console.log(`⏰ Processing scheduled sequences at ${now.toISOString()}`);

  for (const [activeSequenceId, scheduleData] of executionQueue.entries()) {
    try {
      if (scheduleData.nextExecution <= now && scheduleData.status === 'scheduled') {
        console.log(`📧 Processing sequence ${activeSequenceId} scheduled for ${scheduleData.nextExecution.toISOString()}`);
        
        // Call sequence executor
        const executorUrl = process.env.URL || 'http://localhost:8888';
        const processUrl = `${executorUrl}/.netlify/functions/sequence-executor/process/${activeSequenceId}`;

        const response = await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.success) {
            if (result.status === 'completed') {
              // Remove completed sequence from queue
              executionQueue.delete(activeSequenceId);
              console.log(`✅ Sequence ${activeSequenceId} completed and removed from queue`);
            } else {
              // Update schedule for next step
              const nextStep = scheduleData.currentStep + 1;
              if (nextStep < scheduleData.totalSteps) {
                scheduleData.currentStep = nextStep;
                // The executor should have set the correct next execution time
                // We need to get it from the executor's response
                if (result.nextSendAt) {
                  scheduleData.nextExecution = new Date(result.nextSendAt);
                  console.log(`🔄 Sequence ${activeSequenceId} scheduled for ${result.nextSendAt}`);
                } else {
                  // Fallback: minimum 1 minute delay
                  scheduleData.nextExecution = new Date(now.getTime() + 60 * 1000);
                  console.log(`🔄 Sequence ${activeSequenceId} scheduled with 1 minute delay`);
                }
              } else {
                executionQueue.delete(activeSequenceId);
                console.log(`✅ Sequence ${activeSequenceId} all steps completed`);
              }
            }
            results.processed++;
          } else {
            throw new Error(result.message || 'Processing failed');
          }
        } else {
          throw new Error(`Executor responded with status: ${response.status}`);
        }
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing sequence ${activeSequenceId}:`, error);
      results.errors.push({
        activeSequenceId,
        error: error.message
      });
      
      // Mark as failed to prevent retry loops
      scheduleData.status = 'failed';
    }
  }

  console.log(`📊 Processing complete: ${results.processed} processed, ${results.skipped} skipped, ${results.errors.length} errors`);
  return results;
}

// Auto-start scheduler on cold start
if (process.env.NODE_ENV !== 'test') {
  console.log('🔧 Auto-starting sequence scheduler on cold start');
  startScheduler();
}