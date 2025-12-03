const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const maxResults = parseInt(params.maxResults) || 20;
    const pageToken = params.pageToken;
    const query = params.query || '';

    if (event.httpMethod === 'GET') {
      // List messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        pageToken,
        q: query,
      });

      const messages = response.data.messages || [];
      
      // Fetch details for each message
      const messageDetails = await Promise.all(
        messages.map(async (msg) => {
          try {
            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['From', 'To', 'Subject', 'Date'],
            });

            const headers = detail.data.payload.headers.reduce((acc, header) => {
              acc[header.name.toLowerCase()] = header.value;
              return acc;
            }, {});

            return {
              id: detail.data.id,
              threadId: detail.data.threadId,
              labelIds: detail.data.labelIds || [],
              snippet: detail.data.snippet,
              internalDate: detail.data.internalDate,
              from: headers.from || '',
              to: headers.to || '',
              subject: headers.subject || '',
              date: headers.date || '',
              isUnread: (detail.data.labelIds || []).includes('UNREAD'),
              isImportant: (detail.data.labelIds || []).includes('IMPORTANT'),
              isStarred: (detail.data.labelIds || []).includes('STARRED'),
            };
          } catch (error) {
            console.error('Error fetching message details:', error);
            return null;
          }
        })
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          messages: messageDetails.filter(Boolean),
          nextPageToken: response.data.nextPageToken,
          resultSizeEstimate: response.data.resultSizeEstimate,
        }),
      };
    } else if (event.httpMethod === 'POST') {
      // Handle message actions (mark as read, archive, etc.)
      const body = JSON.parse(event.body);
      const { messageIds, action } = body;

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message IDs required' }),
        };
      }

      let results = [];

      switch (action) {
        case 'markAsRead':
          results = await Promise.all(
            messageIds.map(id =>
              gmail.users.messages.modify({
                userId: 'me',
                id,
                requestBody: {
                  removeLabelIds: ['UNREAD'],
                },
              })
            )
          );
          break;

        case 'markAsUnread':
          results = await Promise.all(
            messageIds.map(id =>
              gmail.users.messages.modify({
                userId: 'me',
                id,
                requestBody: {
                  addLabelIds: ['UNREAD'],
                },
              })
            )
          );
          break;

        case 'archive':
          results = await Promise.all(
            messageIds.map(id =>
              gmail.users.messages.modify({
                userId: 'me',
                id,
                requestBody: {
                  removeLabelIds: ['INBOX'],
                },
              })
            )
          );
          break;

        case 'trash':
          results = await Promise.all(
            messageIds.map(id =>
              gmail.users.messages.trash({
                userId: 'me',
                id,
              })
            )
          );
          break;

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid action' }),
          };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, results }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Gmail API error:', error);
    return {
      statusCode: error.code || 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};