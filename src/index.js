import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Globally ignore AbortError rejections (e.g. aborted fetch signals from Supabase)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && (reason.name === 'AbortError' || String(reason).includes('signal is aborted without reason'))) {
      // Prevent React error overlay from treating aborted requests as fatal errors
      event.preventDefault();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
