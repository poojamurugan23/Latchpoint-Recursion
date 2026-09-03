import { Sparkles } from 'lucide-react'

/**
 * Replaces the Pre-Commitment Gate while a user is still calibrating (Phase
 * 3 §1.2). There is nothing to evaluate against yet, so the UI says that
 * honestly instead of faking a verdict — this transaction is genuine usage,
 * processed normally.
 */
export default function CalibrationBanner({ current, total }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-sm bg-surface rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-alt mb-5">
          <Sparkles size={20} className="text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Building your pattern ({current}/{total})
        </h2>
        <p className="text-sm text-text-secondary">
          This transaction is being processed normally. Once we've seen {total} transactions,
          Latchpoint will start actively watching for activity that doesn't match your pattern.
        </p>
      </div>
    </div>
  )
}
