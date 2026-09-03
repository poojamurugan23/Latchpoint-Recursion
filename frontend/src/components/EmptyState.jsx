import { Link } from 'react-router-dom'
import Button from './Button'

export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-bg-subtle">
          <Icon size={24} className="text-ink-400" />
        </div>
      )}
      <p className="text-secondary text-ink-600 mb-4 max-w-xs">{message}</p>
      {action && (
        <Link to={action.to}>
          <Button variant="secondary">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
