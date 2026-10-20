
export type ToastActionElement = ReactNode

export interface ToastProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	variant?: 'default' | 'success' | 'error' | 'warning'
}

export function ToasterToast({
	title,
	description,
	action,
	variant = 'default',
	onOpenChange,
}: ToastProps & { title?: ReactNode; description?: ReactNode; action?: ReactNode }) {
	const border = {
		default: 'border-border',
		success: 'border-green-500',
		error: 'border-red-500',
		warning: 'border-yellow-500',
	}[variant]

	return (
		<div className={`pointer-events-auto w-full rounded-lg border bg-background p-4 shadow-lg ${border}`} role="status">
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					{title && <p className="font-semibold">{title}</p>}
					{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
				</div>
				{action}
				<button type="button" className="text-muted-foreground" aria-label="Fermer" onClick={() => onOpenChange?.(false)}>
					×
				</button>
			</div>
		</div>
	)
}
import type { ReactNode } from 'react'
import { useToast } from '../../hooks/use-toast'

export function Toaster() {
	const { toasts } = useToast()

	return (
		<div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
			{toasts.map((toast) => (
				<ToasterToast key={toast.id} {...toast} />
			))}
		</div>
	)
}
