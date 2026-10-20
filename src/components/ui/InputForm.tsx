import * as React from "react"

type InputProps = React.ComponentProps<"input"> & {
  error?: React.ReactNode
  label?: React.ReactNode
  hint?: React.ReactNode
  autoComplete?: React.HTMLInputAutoCompleteAttribute
}

function InputForm({ className, type, error, label, autoComplete, hint, ...props }: InputProps) {
  return (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input
        name={props.name}
        type={type}
        autoComplete={autoComplete}
        placeholder={props.placeholder}
        value={props.value}
        className={`flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      <span>{error}</span>
      {hint && <span>{hint}</span>}
    </div>
  )
}

export { InputForm }
