import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { PinProvider } from './context/PinContext.jsx'
import PinGate from './components/PinGate.jsx'

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PinProvider>
        <PinGate>
          <App />
        </PinGate>
      </PinProvider>
    </BrowserRouter>
  </StrictMode>,
)
