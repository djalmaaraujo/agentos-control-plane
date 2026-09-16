import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Card({
  className,
  children
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card transition-colors hover:border-[#33333a] hover:bg-card-hover',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-border bg-black/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
      {children}
    </span>
  )
}

export function PillButton({
  children,
  onClick
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-border bg-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-[#3a3a40] hover:bg-white/5 hover:text-white"
    >
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} />
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2 first:mt-0">
      <span className="label">{children}</span>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-faint">
      {children}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-4 text-sm text-red-300">
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded border border-red-900/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-red-200 hover:bg-red-950/40"
        >
          Retry
        </button>
      )}
    </div>
  )
}
