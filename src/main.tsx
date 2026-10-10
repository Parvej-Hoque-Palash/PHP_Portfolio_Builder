import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadRuntimeConfig } from './config/runtimeConfig';
import './index.css';

// Settings saved at /setup must be in place before the auth module loads, since it
// decides at import time whether Google sign-in is configured. So the app is
// imported only after they're applied.
loadRuntimeConfig().finally(async () => {
  const [{ default: App }, { AuthProvider }] = await Promise.all([import('./App.tsx'), import('./context/AuthContext')]);
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>,
  );
});
