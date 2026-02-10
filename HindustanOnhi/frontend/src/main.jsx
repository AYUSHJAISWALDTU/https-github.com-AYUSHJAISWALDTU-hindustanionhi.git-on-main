import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a2e',
                color: '#fff',
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: '14px',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
