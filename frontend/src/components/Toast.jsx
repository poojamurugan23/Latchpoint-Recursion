import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function Toast({ message, show, onDone, durationMs = 2200 }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    setVisible(show)
    if (!show) return
    const timer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, durationMs)
    return () => clearTimeout(timer)
  }, [show, durationMs, onDone])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-md bg-surface border border-border shadow-md px-4 py-3 text-sm text-text-primary">
        <CheckCircle2 size={18} className="text-allow" />
        {message}
      </div>
    </div>
  )
}
