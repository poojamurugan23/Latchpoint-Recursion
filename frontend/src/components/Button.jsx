import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-md',
  secondary: 'bg-transparent text-ink-900 border border-border hover:bg-bg-subtle hover:border-border-strong',
  tertiary: 'bg-transparent text-accent hover:opacity-80 border-0',
  danger: 'bg-transparent text-block border border-border hover:bg-block-bg',
}

const Button = forwardRef(function Button(
  { variant = 'primary', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-button px-5 py-2.5 text-button font-semibold tracking-[0.01em] transition-all duration-[120ms] ease-out active:scale-[0.98] disabled:text-ink-400 disabled:border-ink-400 disabled:cursor-not-allowed disabled:bg-transparent disabled:shadow-none disabled:active:scale-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
