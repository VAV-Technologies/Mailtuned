const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Environment validation
    const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      const getFrontendUrlForError = () => {
        if (process.env.NODE_ENV === 'development' || 
            event.headers.host?.includes('localhost') ||
            event.headers.host?.includes('127.0.0.1')) {
          return 'http://localhost:3000';
        }
        return process.env.URL || 
               event.headers.origin || 
               `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}`;
      };
      const errorUrl = getFrontendUrlForError() + `?error=${encodeURIComponent('Server configuration incomplete. Missing environment variables.')}`;
      return {
        statusCode: 302,
        headers: { ...headers, Location: errorUrl },
        body: ''
      };
    }

    // Get redirect URI using same logic as auth-google function
    const getRedirectUri = () => {
      if (process.env.NODE_ENV === 'development' || 
          event.headers.host?.includes('localhost') ||
          event.headers.host?.includes('127.0.0.1')) {
        return 'http://localhost:3000/.netlify/functions/auth-google-callback';
      }
      
      let siteUrl = process.env.URL;
      if (!siteUrl) {
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const host = event.headers.host;
        siteUrl = `${protocol}://${host}`;
      }
      
      if (!siteUrl.startsWith('https://') && !event.headers.host?.includes('localhost')) {
        siteUrl = siteUrl.replace('http://', 'https://');
      }
      
      return `${siteUrl}/.netlify/functions/auth-google-callback`;
    };

    // Get frontend URL
    const getFrontendUrl = () => {
      if (process.env.NODE_ENV === 'development' || 
          event.headers.host?.includes('localhost') ||
          event.headers.host?.includes('127.0.0.1')) {
        return 'http://localhost:3000';
      }
      return process.env.URL || 
             event.headers.origin || 
             `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}`;
    };
    
    const redirectUri = getRedirectUri();
    console.log('Callback using redirect URI:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const code = event.queryStringParameters?.code;
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Authorization code missing' }),
      };
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Create session data
    const sessionData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    };

    // Redirect to frontend with session data
    const frontendUrl = getFrontendUrl();
    const redirectUrl = `${frontendUrl}?auth=${Buffer.from(JSON.stringify(sessionData)).toString('base64')}`;
    
    console.log('Redirecting to:', frontendUrl);
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        Location: redirectUrl,
      },
      body: '',
    };
  } catch (error) {
    console.error('Auth callback error:', error);
    
    // Redirect to frontend with error
    const getFrontendUrlForError = () => {
      if (process.env.NODE_ENV === 'development' || 
          event.headers.host?.includes('localhost') ||
          event.headers.host?.includes('127.0.0.1')) {
        return 'http://localhost:3000';
      }
      return process.env.URL || 
             event.headers.origin || 
             `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}`;
    };
    
    const errorUrl = `${getFrontendUrlForError()}?error=${encodeURIComponent(error.message)}`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        Location: errorUrl,
      },
      body: '',
    };
  }
};