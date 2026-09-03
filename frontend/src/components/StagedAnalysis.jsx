import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { streamGet } from '../api/client'

const STAGES = [
  { key: 'baseline', label: 'Baseline' },
  { key: 'sequence', label: 'Sequence' },
  { key: 'network', label: 'Network' },
  { key: 'context', label: 'Context' },
  { key: 'behavioral', label: 'Behavior' },
]

/**
 * Shown the moment Confirm is clicked, for a calibrated (non-calibrating)
 * user. Each row fills in as its real SSE stage event arrives — no
 * artificial delay, this is the actual feature_engine computation becoming
 * visible as it happens (Phase 3 §4).
 */
export default function StagedAnalysis({ transactionId, onVerdict, onError }) {
  const [completed, setCompleted] = useState({})
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    streamGet(`/risk/evaluate-stream/${transactionId}`, ({ event, data }) => {
      if (event === 'stage') {
        setCompleted((prev) => ({ ...prev, [data.stage]: data.summary }))
      } else if (event === 'verdict') {
        onVerdict(data)
      }
    }).catch((err) => onError?.(err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-md bg-surface rounded-lg shadow-lg p-8">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Checking this transaction</h2>
        <p className="text-sm text-text-secondary mb-6">
          Comparing against your pattern before anything moves.
        </p>

        <ul className="flex flex-col gap-4">
          {STAGES.map(({ key, label }) => {
            const done = key in completed
            return (
              <li key={key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ease-out ${
                    done ? 'bg-accent' : 'border-2 border-border'
                  }`}
                >
                  {done && <Check size={12} className="text-white" strokeWidth={3} />}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm transition-colors duration-200 ease-out ${
                      done ? 'text-text-primary' : 'text-text-tertiary'
                    }`}
                  >
                    {label}
                  </p>
                  {done && (
                    <p className="text-xs text-text-secondary mt-0.5 transition-opacity duration-200 ease-out">
                      {completed[key]}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
