const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get access token from Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' }),
      };
    }

    const accessToken = authHeader.substring(7);

    // Create OAuth2 client with the access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Parse request body
    const { to, subject, body: emailBody, threadId, messageId } = JSON.parse(event.body);

    if (!to || !subject || !emailBody) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'To, subject, and body are required' }),
      };
    }

    // Create email message
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      emailBody,
    ];

    // If replying to a thread, add threading headers
    if (messageId) {
      messageParts.splice(2, 0, `In-Reply-To: ${messageId}`);
      messageParts.splice(3, 0, `References: ${messageId}`);
    }

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

    if (threadId) {
      sendParams.requestBody.threadId = threadId;
    }

    const response = await gmail.users.messages.send(sendParams);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
      }),
    };
  } catch (error) {
    console.error('Gmail send error:', error);
    return {
      statusCode: error.code || 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};