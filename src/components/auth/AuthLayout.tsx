import { type ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  aside?: ReactNode
}

export default function AuthLayout({ children, aside }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--color-bg)' }}>
      {/* Left panel */}
      <div className="flex flex-col justify-between p-8 lg:p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm tracking-[0.2em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
          >
            ◆ AUTHKIT
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Footer */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-muted)' }}>
          © 2026 AuthKit · Secure by default
        </p>
      </div>

      {/* Right panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
      >
        {aside ?? <DefaultAside />}
      </div>
    </div>
  )
}

function DefaultAside() {
  const stats = [
    { label: 'UPTIME', value: '99.98%' },
    { label: 'LATENCY', value: '< 40ms' },
    { label: 'MFA METHODS', value: '6' },
    { label: 'COMPLIANCES', value: 'SOC2 · GDPR' },
  ]

  return (
    <>
      {/* Grid decoration */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-cream) 1px, transparent 1px), linear-gradient(90deg, var(--color-cream) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Accent blob */}
      <div
        className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-15"
        style={{ background: 'var(--color-accent)' }}
      />

      {/* Quote */}
      <div className="relative z-10 mt-auto">
        <p
          className="text-4xl leading-tight mb-8"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}
        >
          "Security is not a product — it's a process."
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-muted)', letterSpacing: '0.1em' }}>
          — BRUCE SCHNEIER
        </p>
      </div>

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-4"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.12em' }}>
              {s.label}
            </p>
            <p className="mt-1 text-xl font-medium" style={{ color: 'var(--color-accent)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
