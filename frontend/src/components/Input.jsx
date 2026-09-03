import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, className = '', id, ...props }, ref) {
  const inputId = id || props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-tertiary outline-none transition-colors duration-150 ease-out focus:border-accent ${className}`}
        {...props}
      />
    </div>
  )
})

export default Input
