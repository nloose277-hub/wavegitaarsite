import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './lib/cart.tsx';
import { SiteProvider } from './lib/site-context.tsx';
import { AuthProvider } from './lib/auth.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SiteProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </SiteProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
