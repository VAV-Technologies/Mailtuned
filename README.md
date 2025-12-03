# 📧 Gmail Inbox Manager - React SaaS App

A modern Gmail inbox manager built with React and Netlify Functions that connects to your real Gmail account via Google OAuth.

## 🚀 Quick Start

### For End Users
1. Visit the deployed app
2. Click "Continue with Google"  
3. Authorize Gmail access
4. Start managing your emails!

### For Developers

**Development:**
```bash
npm install
npm start    # Starts both React (port 3000) and Functions (port 8888)
```

**Production Build:**
```bash
npm run build    # Creates build/ folder
# Then drag-and-drop build/ folder to Netlify
```

## ✨ Features

- ✅ **Real Gmail Integration** - Connect with your actual Gmail account
- ✅ **Google OAuth Authentication** - Secure login with Google
- ✅ **Email Management** - View, read, reply, and organize emails
- ✅ **Thread View** - Full conversation threads with all messages
- ✅ **Smart Labels** - Organize emails with custom labels
- ✅ **CRM Pipeline** - Convert leads from emails to CRM prospects
- ✅ **Email Templates** - Create and manage reusable email templates
- ✅ **Scheduled Sending** - Schedule emails for later delivery
- ✅ **Analytics Dashboard** - Track email performance and insights
- ✅ **Professional UI** - Modern, responsive interface

## 🏗️ Architecture

This is a **React SaaS app with Netlify Functions** (serverless backend):

```
/
├── src/                    # React app source code
│   ├── components/         # React UI components
│   ├── contexts/          # Auth context for global state
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   └── utils/             # Utility functions
├── netlify/functions/      # Serverless backend functions
├── public/                # React public files
├── build/                 # Production build (created by npm run build)
├── DEPLOYMENT.md          # Deployment instructions
└── _legacy/               # Old files (Express backend, HTML prototypes)
```

## 🔐 OAuth Setup for Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick setup:**
1. Set environment variables in Netlify:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` 
   - `JWT_SECRET` (generate secure random value)

2. Add redirect URI to Google Console:
   - `https://your-app.netlify.app/.netlify/functions/auth-google-callback`

## 🛠️ Development Commands

```bash
# Start development (both React and Functions)
npm start

# Start only React app (port 3000)
npm run react-only

# Start only Functions server (port 8888)
npm run functions-only

# Build for production
npm run build

# Deploy to Netlify (requires netlify CLI)
netlify deploy --prod
```

## 📁 Key Files

- **`src/App.js`** - Main React app component
- **`src/contexts/AuthContext.jsx`** - Global authentication state
- **`netlify/functions/auth-google.js`** - OAuth authentication handler
- **`netlify/functions/gmail-messages.js`** - Gmail API integration
- **`package.json`** - Dependencies and scripts
- **`.env`** - Environment variables (for development)

## 🔧 How It Works

### Authentication Flow
1. User clicks "Continue with Google"
2. App redirects to Google OAuth
3. User grants Gmail permissions
4. Google redirects back with authorization code
5. App exchanges code for access tokens
6. User is authenticated and can access Gmail

### Gmail Integration
- **Netlify Functions** handle Gmail API calls securely
- **React app** provides the user interface
- **Real-time data** from your actual Gmail account
- **Full CRUD operations** (read, send, delete, organize)

## 🚫 What's in `_legacy/`

The `_legacy/` folder contains old prototypes and unused code:
- **`backend/`** - Old Express.js server (replaced by Netlify Functions)
- **`*.html`** - Standalone HTML prototypes (replaced by React app)
- **`serve-preview.js`** - Old preview server (not needed)

These files are kept for reference but are not part of the current app.

## 📊 Production Architecture

**Development (2 servers):**
- React: `http://localhost:3000`
- Functions: `http://localhost:8888` (proxied)

**Production (1 domain):**
- Static files: `https://your-app.netlify.app/`
- Functions: `https://your-app.netlify.app/.netlify/functions/`

In production, Netlify automatically serves both static files and functions from the same domain.

## 🔐 Security Features

- JWT token authentication
- Secure OAuth 2.0 flow
- Environment-aware configuration
- Runtime security validation
- CORS protection
- No secrets in client-side code

## 📚 Further Reading

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [Netlify Functions Docs](https://functions.netlify.com/)
- [Google Gmail API](https://developers.google.com/gmail/api)
- [React Documentation](https://react.dev/)

---

**Need help?** Check the setup instructions in the app's UI or see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration steps.