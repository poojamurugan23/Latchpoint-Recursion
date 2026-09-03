import { ShieldCheck } from 'lucide-react'
import Button from './Button'

/**
 * The dedicated full-screen moment on the 10th calibrating transaction
 * (Phase 3 §1.3) — the clearest possible signal that Latchpoint required
 * and used real personal history, not canned demo logic.
 */
export default function PatternReady({ onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-allow-bg mb-6">
          <ShieldCheck size={30} className="text-allow" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-3">Your pattern is ready.</h1>
        <p className="text-base text-text-secondary mb-8 leading-relaxed">
          Latchpoint is now actively watching for activity that doesn't match your established
          pattern — before it becomes irreversible.
        </p>
        <Button variant="primary" onClick={onContinue} className="px-6">
          Continue to Dashboard
        </Button>
      </div>
    </div>
  )
}
