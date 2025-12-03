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
    // Environment validation
    const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration Error',
          message: 'Server configuration incomplete. Missing environment variables.',
          details: `Missing: ${missingVars.join(', ')}`,
          missingVars
        })
      };
    }

    // Security validation - prevent using default secrets in production
    const isProduction = !event.headers.host?.includes('localhost');
    const isDefaultJWTSecret = process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production' ||
                              process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-please';
    
    if (isProduction && isDefaultJWTSecret) {
      console.error('SECURITY WARNING: Default JWT_SECRET detected in production!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration Error',
          message: 'Server configuration incomplete. Please contact administrator.',
          details: 'Default JWT secret detected in production environment'
        })
      };
    }
    
    // Environment-aware redirect URI
    const getRedirectUri = () => {
      // Development environment
      if (process.env.NODE_ENV === 'development' || 
          event.headers.host?.includes('localhost') ||
          event.headers.host?.includes('127.0.0.1')) {
        return 'http://localhost:3000/.netlify/functions/auth-google-callback';
      }
      
      // Production environment - prefer Netlify URL, fallback to constructed URL
      let siteUrl = process.env.URL; // Netlify provides this in production
      
      if (!siteUrl) {
        // Construct from headers as fallback
        const protocol = event.headers['x-forwarded-proto'] || 'https';
        const host = event.headers.host;
        siteUrl = `${protocol}://${host}`;
      }
      
      // Ensure HTTPS for production
      if (!siteUrl.startsWith('https://') && !event.headers.host?.includes('localhost')) {
        siteUrl = siteUrl.replace('http://', 'https://');
      }
      
      return `${siteUrl}/.netlify/functions/auth-google-callback`;
    };
    
    const redirectUri = getRedirectUri();
    console.log('Using redirect URI:', redirectUri);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Generate auth URL
    const scopes = [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ authUrl }),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};