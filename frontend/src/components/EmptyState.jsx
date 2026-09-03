import { Link } from 'react-router-dom'
import Button from './Button'

export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4">
          <Icon size={32} className="text-ink-400" />
        </div>
      )}
      <p className="text-secondary text-ink-600 mb-4">{message}</p>
      {action && (
        <Link to={action.to}>
          <Button variant="secondary">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
