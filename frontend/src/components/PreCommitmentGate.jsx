import { useState } from 'react'
import { ChevronDown, ShieldQuestion, Clock, ShieldX } from 'lucide-react'
import Button from './Button'
import { useEventTracker } from '../context/EventTrackerContext'

const CONFIG = {
  VERIFY: {
    icon: ShieldQuestion,
    color: 'text-verify',
    bg: 'bg-verify-bg',
    title: "Let's double-check this",
    primaryLabel: 'Verify & Continue',
  },
  HOLD: {
    icon: Clock,
    color: 'text-hold',
    bg: 'bg-hold-bg',
    title: 'This needs a closer look',
    primaryLabel: 'Submit for Review',
  },
  BLOCK: {
    icon: ShieldX,
    color: 'text-block',
    bg: 'bg-block-bg',
    title: "We can't complete this right now",
    primaryLabel: null,
  },
}

export default function PreCommitmentGate({ decision, reasons = [], onVerify, onHold, onCancel }) {
  const [expanded, setExpanded] = useState(false)
  const { trackEvent } = useEventTracker()
  const cfg = CONFIG[decision]
  if (!cfg) return null
  const Icon = cfg.icon

  function toggleExpanded() {
    if (!expanded) trackEvent('gate_reason_expanded')
    setExpanded((e) => !e)
  }

  function handlePrimary() {
    trackEvent('confirm_clicked')
    if (decision === 'VERIFY') onVerify?.()
    else if (decision === 'HOLD') onHold?.()
  }

  function handleCancel() {
    trackEvent('cancel_clicked')
    onCancel?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-md bg-surface rounded-lg shadow-lg p-8 transition-all duration-200 ease-out">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${cfg.bg} mb-5`}>
          <Icon size={22} className={cfg.color} />
        </div>

        <h2 className="text-lg font-semibold text-text-primary mb-1">{cfg.title}</h2>
        <p className="text-sm text-text-secondary mb-5">
          Before this goes through, here's what we noticed:
        </p>

        <ul className="flex flex-col gap-2.5 mb-5">
          {reasons.slice(0, 3).map((reason, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-text-primary">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.color.replace('text-', 'bg-')}`} />
              {reason}
            </li>
          ))}
        </ul>

        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors duration-150 ease-out"
        >
          <ChevronDown size={16} className={`transition-transform duration-150 ease-out ${expanded ? 'rotate-180' : ''}`} />
          Why am I seeing this?
        </button>

        {expanded && (
          <div className="rounded-sm bg-surface-alt p-4 text-sm text-text-secondary mb-6">
            Latchpoint compares this action against your typical patterns — amounts, timing,
            recipients, and how this transaction was carried out — before it's confirmed, not after.
            {decision === 'BLOCK' && (
              <>
                {' '}This combination of signals is unusual enough that we're not able to let it
                proceed automatically.
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {cfg.primaryLabel && (
            <Button variant="primary" onClick={handlePrimary} className="w-full">
              {cfg.primaryLabel}
            </Button>
          )}
          <Button variant="ghost" onClick={handleCancel} className="w-full">
            Cancel
          </Button>
          {decision === 'BLOCK' && (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-center text-sm text-text-secondary hover:text-text-primary mt-1 transition-colors duration-150 ease-out"
            >
              Contact Support
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
