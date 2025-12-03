# 📁 Legacy Files

These files are **no longer used** in the current Gmail Inbox Manager app. They are kept for reference only.

## What's in here:

### `backend/` - Old Express.js Server
- **Status**: Replaced by Netlify Functions
- **Why kept**: Contains database schema and API logic that might be useful for reference
- **Note**: The current app uses serverless functions in `netlify/functions/` instead

### HTML Files - Standalone Prototypes
- **`gmail-inbox-standalone.html`** - Early standalone version
- **`gmail-inbox-complete.html`** - Another prototype
- **`index.html`** - Root HTML file (not used)
- **`preview.html`** - Preview version
- **`test-sequence-controls.html`** - Testing interface
- **Status**: Replaced by React app in `src/`

### `serve-preview.js` - Old Preview Server
- **Status**: Not needed (React handles development server)
- **Why kept**: Shows how preview functionality was implemented

## Current Architecture

The current app uses:
- **React** (in `src/`) for the frontend
- **Netlify Functions** (in `netlify/functions/`) for the backend
- **Drag-and-drop deployment** to Netlify

## For Developers

If you're looking at these files to understand the evolution:
1. Started with standalone HTML prototypes
2. Built Express.js backend with SQLite database
3. **Current**: Moved to React + Netlify Functions (serverless)

The serverless approach is simpler, more scalable, and easier to deploy.

---

**⚠️ Important**: Do not use these files in the current project. They will not work with the current architecture.