import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './utils/monitoring'
import { registerServiceWorker } from './utils/offline'

initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support and "install app"; skipped in dev so Vite's HMR is not cached
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => registerServiceWorker())
}
