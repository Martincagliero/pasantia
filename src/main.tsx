import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider'
import { captureReferral } from './lib/referral'
// Empieza a capturar el evento de instalación PWA lo antes posible.
import './lib/pwaInstall'

// Guardar el código de promotor (?ref=) apenas carga, antes de renderizar.
captureReferral()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Registrar el service worker (para PWA + notificaciones push).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore: sin SW la app funciona igual, solo sin push */
    });
  });
}
