import AuthButton from "./AuthButton";

export function SuccessState({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div style={{ width: '52px', height: '52px', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-accent)', fontSize: '1.5rem' }}>✓</span>
      </div>
      <div>
        <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-cream)' }}>Check your inbox</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          We sent a verification link to <strong style={{ color: 'var(--color-cream)' }}>{email}</strong>. Click the link to activate your account.
        </p>
      </div>
      <div
        className="p-4"
        style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          DIDN'T RECEIVE AN EMAIL? Check your spam folder or wait a few minutes before requesting a new link.
        </p>
      </div>
      <AuthButton type="button" variant="ghost" onClick={onBack}>← Back to sign in</AuthButton>
    </div>
  )
}