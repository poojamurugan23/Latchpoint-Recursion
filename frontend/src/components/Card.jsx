export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-md shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
