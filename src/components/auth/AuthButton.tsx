import { type ButtonHTMLAttributes } from 'react'

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export default function AuthButton({ children, loading, variant = 'primary', ...props }: AuthButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        background: isPrimary ? (loading || props.disabled ? 'var(--color-border-bright)' : 'var(--color-accent)') : 'transparent',
        color: isPrimary ? '#0c0c0c' : 'var(--color-cream)',
        border: isPrimary ? 'none' : '1px solid var(--color-border-bright)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 500,
        cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, opacity 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!loading && !props.disabled) {
          if (isPrimary) e.currentTarget.style.background = 'var(--color-accent-dim)'
          else e.currentTarget.style.borderColor = 'var(--color-cream)'
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!loading && !props.disabled) {
          if (isPrimary) e.currentTarget.style.background = 'var(--color-accent)'
          else e.currentTarget.style.borderColor = 'var(--color-border-bright)'
        }
        props.onMouseLeave?.(e)
      }}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid transparent',
            borderTopColor: isPrimary ? '#0c0c0c' : 'var(--color-cream)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  )
}
