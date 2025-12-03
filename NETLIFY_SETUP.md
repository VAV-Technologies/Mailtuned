# Netlify Deployment Setup Guide

This guide will help you properly configure your Gmail Inbox Manager for Netlify deployment.

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to APIs & Services → Library
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://YOUR-SITE-NAME.netlify.app/.netlify/functions/auth-google-callback
     ```
   - Save the Client ID and Client Secret

## 2. Netlify Environment Variables

Set these environment variables in your Netlify dashboard (Site Settings → Environment Variables):

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=generate_a_secure_random_string_here
```

### Generate JWT Secret
Run this command to generate a secure JWT secret:
```bash
openssl rand -base64 32
```

## 3. Update Redirect URI

After deploying to Netlify:
1. Note your Netlify site URL (e.g., `https://amazing-app-123.netlify.app`)
2. Go back to Google Cloud Console → APIs & Services → Credentials
3. Edit your OAuth 2.0 client
4. Update the authorized redirect URI to:
   ```
   https://your-actual-netlify-url.netlify.app/.netlify/functions/auth-google-callback
   ```

## 4. Deployment Commands

```bash
# Build and deploy
npm run build
netlify deploy --prod

# Or use the package.json script
npm run deploy
```

## Troubleshooting

### "Failed to start authentication"
- Check that all environment variables are set in Netlify
- Verify the redirect URI matches exactly in Google Cloud Console

### "redirect_uri_mismatch"
- The redirect URI in Google Cloud Console must match your Netlify URL exactly
- Make sure you're using HTTPS (not HTTP) for production

### Functions not working
- Ensure your `netlify.toml` is configured correctly
- Check the Functions tab in your Netlify dashboard for error logs

## Security Notes

- Never commit your `.env` files to git
- Use strong, unique values for JWT_SECRET
- Regularly rotate your Google OAuth credentials