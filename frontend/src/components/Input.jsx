import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, className = "", id, ...props },
  ref,
) {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-secondary font-medium text-ink-600"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-[10px] border border-border bg-white px-3 py-3 text-body text-ink-900 placeholder:text-ink-400 outline-none transition-all duration-[120ms] ease-out focus:border-accent focus:shadow-[0_0_0_3px_rgba(35,38,92,0.08)] ${className}`}
        {...props}
      />
    </div>
  );
});

export default Input;
