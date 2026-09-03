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
 * Shown the moment Confirm is clicked for a calibrated user.
 * Each stage fills in as its real SSE event arrives — making real feature_engine
 * and model computation visible as it happens (Phase 3 §4).
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
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-md p-8 transition-all duration-200 ease-out">
        <h2 className="font-display text-verdict text-ink-900 mb-1">
          Checking this commitment
        </h2>
        <p className="font-sans text-secondary text-ink-600 mb-6">
          Comparing against your pattern before anything moves.
        </p>

        <ul className="flex flex-col gap-4">
          {STAGES.map(({ key, label }) => {
            const done = key in completed
            return (
              <li key={key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ease-out ${
                    done ? 'bg-accent text-white' : 'border border-border bg-white text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <div className="flex-1">
                  <p
                    className={`text-secondary transition-colors duration-150 ease-out ${
                      done ? 'text-ink-900 font-medium' : 'text-ink-400'
                    }`}
                  >
                    {label}
                  </p>
                  {done && (
                    <p className="text-caption text-ink-600 mt-0.5 transition-opacity duration-150 ease-out">
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
