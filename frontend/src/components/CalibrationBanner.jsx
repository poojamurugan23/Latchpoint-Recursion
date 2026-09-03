import { Sparkles } from 'lucide-react'

/**
 * Replaces the Pre-Commitment Gate while a user is still calibrating (Phase 3 §1.2).
 * There is nothing to evaluate against yet, so the UI states that honestly instead of
 * faking a risk verdict.
 */
export default function CalibrationBanner({ current, total = 10 }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-sm bg-white rounded-[20px] shadow-md p-8 text-center transition-all duration-200 ease-out">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-tint mb-5">
          <Sparkles size={22} className="text-accent" />
        </div>
        <h2 className="font-display text-verdict text-ink-900 mb-2">
          Building your pattern ({current}/{total})
        </h2>
        <p className="font-sans text-secondary text-ink-600 leading-relaxed">
          This transaction is being processed normally. Once you complete {total} transactions,
          Latchpoint will actively watch for activity that doesn't match your personal pattern.
        </p>
      </div>
    </div>
  )
}
