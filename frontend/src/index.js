// In src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HelmetProvider } from 'react-helmet-async'; // <-- 1. Import

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; // <-- Import ThemeProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap everything with ThemeProvider */}
    <ThemeProvider>
      <AuthProvider>
         <HelmetProvider>
          <App />
         </HelmetProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);