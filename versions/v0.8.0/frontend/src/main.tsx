import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SharedStateProvider } from '@/core/contexts/SharedStateContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SharedStateProvider>
      <App />
    </SharedStateProvider>
  </StrictMode>,
)
