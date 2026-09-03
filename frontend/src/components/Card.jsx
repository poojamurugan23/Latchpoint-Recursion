export default function Card({ className = '', children, hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-border rounded-md shadow-sm p-6 ${
        hover ? 'transition-all duration-[160ms] ease-out hover:shadow-md hover:border-border-strong' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
