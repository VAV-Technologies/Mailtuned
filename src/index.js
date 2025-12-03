import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import GmailInboxManager from './GmailInboxManager';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GmailInboxManager />
  </React.StrictMode>
);