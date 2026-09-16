import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { OSProvider } from './lib/osContext'
import { AuthGate } from './components/AuthGate'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthGate>
        <OSProvider>
          <App />
        </OSProvider>
      </AuthGate>
    </BrowserRouter>
  </StrictMode>
)
