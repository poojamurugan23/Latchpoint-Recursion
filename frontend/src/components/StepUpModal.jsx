import { useState } from 'react'
import { ShieldQuestion } from 'lucide-react'
import Button from './Button'
import Input from './Input'
import { useEventTracker } from '../context/EventTrackerContext'

export default function StepUpModal({ reasons = [], onSubmit, onCancel }) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { trackEvent } = useEventTracker()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const success = /^\d{6}$/.test(code)
    trackEvent('step_up_attempted', { success })
    try {
      await onSubmit(code)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-sm bg-surface rounded-lg shadow-lg p-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-verify-bg mb-5">
          <ShieldQuestion size={22} className="text-verify" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Verify it's you</h2>
        <p className="text-sm text-text-secondary mb-5">
          Enter the 6-digit code we sent you to continue.
        </p>

        <ul className="flex flex-col gap-2 mb-5">
          {reasons.slice(0, 2).map((reason, i) => (
            <li key={i} className="text-xs text-text-secondary">
              • {reason}
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Verification code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <Button type="submit" disabled={submitting || code.length !== 6} className="w-full">
            {submitting ? 'Verifying…' : 'Confirm'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </form>
      </div>
    </div>
  )
}
