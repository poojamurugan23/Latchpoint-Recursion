import { MapPin } from "lucide-react";
import Button from "./Button";

/**
 * A calm, on-brand explanation shown BEFORE the real browser geolocation
 * prompt fires — so the native OS dialog doesn't appear out of nowhere
 * against an unstyled page. Declining falls back silently to IP geolocation.
 */
export default function LocationConsent({ onAllow, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm bg-white border border-border rounded-md shadow-md p-5 transition-all duration-200 ease-out">
      <div className="flex items-start gap-3.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent-tint text-accent flex-shrink-0">
          <MapPin size={18} />
        </div>
        <div className="flex-1">
          <p className="text-secondary font-semibold text-ink-900 mb-1">
            Check session location?
          </p>
          <p className="text-caption text-ink-600 mb-4 leading-relaxed">
            Helps Latchpoint recognize when a commitment is initiated from an
            anomalous geographic location. You can decline anytime.
          </p>
          <div className="flex gap-2.5">
            <Button
              variant="primary"
              onClick={onAllow}
              className="text-caption py-1.5 px-3.5"
            >
              Allow
            </Button>
            <Button
              variant="secondary"
              onClick={onDismiss}
              className="text-caption py-1.5 px-3.5"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
