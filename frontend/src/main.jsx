import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Playfair Display — display font (wordmark, hero, page titles, gate verdict only)
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/500-italic.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'

// Montserrat — body font (everything else)
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'

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
