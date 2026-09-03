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
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium ${STYLES[decision] || 'bg-surface-alt text-text-secondary'} ${className}`}
    >
      {LABELS[decision] || decision}
    </span>
  )
}
