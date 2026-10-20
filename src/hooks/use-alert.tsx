import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertOptions {
  type?: AlertType
  title: string
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface AlertState extends AlertOptions {
  open: boolean
}

interface AlertContextValue {
  alert: (options: AlertOptions) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>({ open: false, title: '' })

  const value = useMemo<AlertContextValue>(() => ({
    alert: (options) => setState({ ...options, open: true }),
    hideAlert: () => setState((current) => ({ ...current, open: false })),
  }), [])

  const close = () => {
    state.onCancel?.()
    value.hideAlert()
  }

  const confirm = async () => {
    await state.onConfirm?.()
    value.hideAlert()
  }

  return (
    <AlertContext.Provider value={value}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
          <div
            className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alert-title"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{state.type ?? 'info'}</p>
            <h2 id="alert-title" className="text-lg font-semibold">{state.title}</h2>
            {state.message && <div className="mt-2 text-sm text-muted-foreground">{state.message}</div>}
            <div className="mt-6 flex justify-end gap-3">
              {state.showCancelButton && (
                <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={close}>
                  {state.cancelText ?? 'Annuler'}
                </button>
              )}
              <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={confirm}>
                {state.confirmText ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}

// Context hooks are intentionally colocated with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
      throw new Error('useAlert doit être utilisé dans AlertProvider')
  }
  return context
}
