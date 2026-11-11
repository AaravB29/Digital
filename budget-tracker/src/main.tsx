import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initTheme } from './hooks/useTheme';

initTheme();

// Preview builds (VITE_PREVIEW=1) run inside a sandboxed frame without real URLs.
// Static hosting such as GitHub Pages (VITE_ROUTER=hash) uses #/month/2026-11 style addresses.
const Router = import.meta.env.VITE_PREVIEW ? MemoryRouter : import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
