import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { api, sessionId } from '../api/client'

const EventTrackerContext = createContext(null)

const FLUSH_INTERVAL_MS = 2000
const IDLE_THRESHOLD_MS = 4000

export function EventTrackerProvider({ children }) {
  const queueRef = useRef([])
  const lastActivityRef = useRef(Date.now())
  const idleFiredRef = useRef(false)

  const trackEvent = useCallback((eventType, payload = {}, transactionId = null) => {
    queueRef.current.push({
      session_id: sessionId,
      transaction_id: transactionId,
      event_type: eventType,
      payload,
    })
    lastActivityRef.current = Date.now()
    idleFiredRef.current = false
  }, [])

  const flush = useCallback(() => {
    if (queueRef.current.length === 0) return
    const batch = queueRef.current
    queueRef.current = []
    api.post('/events', batch).catch(() => {
      // best-effort — don't block the UI on telemetry failures
    })
  }, [])

  // Geolocation is sent immediately (not batched) so the session's
  // lat/lng lands before any risk evaluation that depends on it.
  const captureGeolocation = useCallback(() => {
    if (!navigator.geolocation) return Promise.resolve(false)
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const event = {
            session_id: sessionId,
            transaction_id: null,
            event_type: 'geolocation_captured',
            payload: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'gps',
            },
          }
          api.post('/events', event).catch(() => {})
          resolve(true)
        },
        () => resolve(false),
        { timeout: 5000, maximumAge: 300000 }
      )
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS)
    const onUnload = () => flush()
    window.addEventListener('beforeunload', onUnload)

    const idleCheck = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current
      if (idleFor > IDLE_THRESHOLD_MS && !idleFiredRef.current) {
        idleFiredRef.current = true
        trackEvent('pause_detected', { duration_ms: idleFor })
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(idleCheck)
      window.removeEventListener('beforeunload', onUnload)
      flush()
    }
  }, [flush, trackEvent])

  return (
    <EventTrackerContext.Provider value={{ trackEvent, captureGeolocation }}>
      {children}
    </EventTrackerContext.Provider>
  )
}

export function useEventTracker() {
  const ctx = useContext(EventTrackerContext)
  if (!ctx) throw new Error('useEventTracker must be used within EventTrackerProvider')
  return ctx
}
