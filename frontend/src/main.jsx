import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/base.css';
import './styles/community.css';

// Tema guardado (si no hay, se sigue el del sistema).
try {
  const tema = localStorage.getItem('gb-tema');
  if (tema === 'dark' || tema === 'light') document.documentElement.dataset.theme = tema;
} catch { /* sin localStorage */ }

// Service worker: solo en https o en local (la app se puede instalar como PWA)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('service worker:', e.message));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
