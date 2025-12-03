const { schedule } = require('@netlify/functions');

// This function runs periodically to check for scheduled sequence executions
const scheduledHandler = async (event, context) => {
  console.log('🕐 Sequence scheduler triggered at:', new Date().toISOString());

  try {
    // Call the sequence executor to check for pending executions
    const executorUrl = process.env.URL || 'http://localhost:8888';
    const checkUrl = `${executorUrl}/.netlify/functions/sequence-executor/check`;

    console.log('📞 Calling sequence executor:', checkUrl);

    // Make internal call to sequence executor
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer system', // System token for internal calls
      },
    });

    if (!response.ok) {
      throw new Error(`Executor responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Scheduler result:', {
      processed: result.processed,
      errors: result.errors?.length || 0,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processed: result.processed,
        errors: result.errors?.length || 0,
        message: `Scheduler processed ${result.processed} executions`
      }),
    };

  } catch (error) {
    console.error('❌ Scheduler error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

// Export the scheduled handler directly - Netlify will detect this pattern
exports.handler = schedule('*/5 * * * *', scheduledHandler);

// Also export scheduledHandler for manual testing
exports.scheduledHandler = scheduledHandler;