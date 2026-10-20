import * as React from "react";

type InputProps = React.ComponentProps<"input"> & {
  error?: React.AriaAttributes["aria-invalid"];
};

function InputNative({ className, error, ...props }: InputProps) {
  return (
    <div>
      <input
        {...props}
        aria-invalid={error}
        className={`flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
    </div>
  );
}

export { InputNative };
