import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { EventTrackerProvider } from './context/EventTrackerContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <EventTrackerProvider>
        <App />
      </EventTrackerProvider>
    </AuthProvider>
  </StrictMode>,
)
