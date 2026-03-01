// ============================================================
// src/main.jsx
// This is the entry point of the React application.
//
// It does 3 things:
//   1. Wraps the app in BrowserRouter — enables React Router
//   2. Wraps the app in AuthProvider — makes login/user state
//      available to every component in the app
//   3. Renders the App component into the #root div in index.html
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
