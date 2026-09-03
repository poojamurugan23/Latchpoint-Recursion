const STYLES = {
  ALLOW: 'bg-allow-bg text-allow',
  VERIFY: 'bg-verify-bg text-verify',
  HOLD: 'bg-hold-bg text-hold',
  BLOCK: 'bg-block-bg text-block',
}

const LABELS = {
  ALLOW: 'Allowed',
  VERIFY: 'Verify',
  HOLD: 'Under review',
  BLOCK: 'Blocked',
}

export default function RiskBadge({ decision, className = '' }) {
  if (!decision) return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold ${STYLES[decision] || 'bg-bg-subtle text-ink-600'} ${className}`}
    >
      {LABELS[decision] || decision}
    </span>
  )
}
