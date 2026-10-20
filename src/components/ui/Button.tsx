import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonSizes, buttonVariants } from "./buttonVariants";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: keyof typeof buttonVariants;
  customClass?: string;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  isPrimary?: boolean;
  text?: ReactNode;
  children?: ReactNode;
};

function Button({
  variant = "none",
  customClass,
  size = "default",
  children,
  loading = false,
  disabled = false,
  isPrimary = false,
  text,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50";
  const buttonClasses = [
    variant !== "none" ? baseClasses : "",
    buttonVariants[variant],
    buttonSizes[size],
    customClass,
  ].filter(Boolean).join(" ");

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        ...style,
      }}
      className={buttonClasses}
      onMouseEnter={(event) => {
        if (!loading && !disabled) {
          if (isPrimary) event.currentTarget.style.background = "var(--color-accent-dim)";
          else event.currentTarget.style.borderColor = "var(--color-cream)";
        }
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (!loading && !disabled) {
          if (isPrimary) event.currentTarget.style.background = "var(--color-accent)";
          else event.currentTarget.style.borderColor = "var(--color-border-bright)";
        }
        onMouseLeave?.(event);
      }}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children ?? text}
    </button>
  );
}

export { Button };
