const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    if (event.httpMethod === 'GET') {
      // List labels
      const response = await gmail.users.labels.list({
        userId: 'me',
      });

      const labels = response.data.labels || [];
      
      // Filter out system labels unless requested
      const includeSystem = event.queryStringParameters?.includeSystem === 'true';
      const filteredLabels = includeSystem 
        ? labels 
        : labels.filter(label => label.type === 'user');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ labels: filteredLabels }),
      };
    } else if (event.httpMethod === 'POST') {
      // Create a new label
      const { name, labelListVisibility, messageListVisibility, color } = JSON.parse(event.body);

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Label name is required' }),
        };
      }

      const labelObject = {
        name,
        labelListVisibility: labelListVisibility || 'labelShow',
        messageListVisibility: messageListVisibility || 'show',
      };

      if (color) {
        labelObject.color = color;
      }

      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: labelObject,
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ label: response.data }),
      };
    } else if (event.httpMethod === 'DELETE') {
      // Delete a label
      const labelId = event.path.split('/').pop();

      if (!labelId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Label ID is required' }),
        };
      }

      await gmail.users.labels.delete({
        userId: 'me',
        id: labelId,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Labels API error:', error);
    return {
      statusCode: error.code || 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};