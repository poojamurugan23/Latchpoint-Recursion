import { MapPin } from 'lucide-react'
import Button from './Button'

/**
 * A calm, on-brand explanation shown BEFORE the real browser geolocation
 * prompt fires — so the native OS dialog (which can't be restyled) doesn't
 * appear out of nowhere against an otherwise designed page. Declining falls
 * back silently to the existing IP-derived location stub.
 */
export default function LocationConsent({ onAllow, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-xs bg-surface border border-border rounded-md shadow-md p-5 transition-all duration-200 ease-out">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-alt flex-shrink-0">
          <MapPin size={16} className="text-text-secondary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary mb-1">Check this session's location?</p>
          <p className="text-xs text-text-secondary mb-3">
            Helps us recognize when a transaction is happening somewhere unusual for you. You can
            decline — we'll fall back to a coarser estimate.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={onAllow} className="text-xs px-3 py-1.5">
              Allow
            </Button>
            <Button variant="ghost" onClick={onDismiss} className="text-xs px-3 py-1.5">
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
