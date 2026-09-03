import { ShieldCheck } from 'lucide-react'
import Button from './Button'

/**
 * Dedicated full-screen milestone on the 10th calibrating transaction (Phase 3 §1.3).
 * Visibly demonstrates that Latchpoint requires and uses real personal history rather
 * than canned static rules.
 */
export default function PatternReady({ onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-allow-bg mb-6">
          <ShieldCheck size={32} className="text-allow" />
        </div>
        <h1 className="font-display text-title font-semibold text-ink-900 mb-3">
          Your pattern is ready.
        </h1>
        <p className="font-sans text-body text-ink-600 mb-8 leading-relaxed">
          Latchpoint is now actively watching for activity that doesn't match your established pattern — before it becomes irreversible.
        </p>
        <Button variant="primary" onClick={onContinue} className="px-6 py-3">
          Continue to Dashboard
        </Button>
      </div>
    </div>
  )
}
