import { forwardRef } from 'react'

const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover',
  ghost:
    'bg-transparent text-text-secondary border border-border hover:bg-surface-alt',
  danger:
    'bg-transparent text-block border border-border hover:bg-block-bg',
}

const Button = forwardRef(function Button(
  { variant = 'primary', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
