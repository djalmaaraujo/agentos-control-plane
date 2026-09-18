import { useState, type ReactNode } from 'react'
import { Bot, Check, ChevronLeft, ChevronRight, Trash2, Users, Workflow, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from './ui'

// Inline delete with a two-step confirm, for use inside a table action cell.
export function ConfirmDelete({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      {confirm ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-red-300">Delete?</span>
          <button disabled={busy} onClick={run} className="text-red-400 hover:text-red-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setConfirm(false)} className="text-faint hover:text-fg">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="text-faint hover:text-red-300" title="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// Shows which agent/team/workflow owns a row (session, trace, …).
export function PrimitiveTag({
  agentId,
  teamId,
  workflowId
}: {
  agentId?: string | null
  teamId?: string | null
  workflowId?: string | null
}) {
  const [Icon, id] = teamId
    ? [Users, teamId]
    : workflowId
      ? [Workflow, workflowId]
      : agentId
        ? [Bot, agentId]
        : [Bot, null]
  if (!id) return <span className="text-faint">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      {id}
    </span>
  )
}

export function PageHeader({
  title,
  actions,
  children
}: {
  title: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="border-b border-border-soft px-8 pb-4 pt-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[15px] font-semibold text-fg">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  width?: string
  render?: (row: T) => ReactNode
}

export interface TableSelection {
  selected: Set<string>
  onToggle: (key: string) => void
  onToggleAll: (keys: string[]) => void
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  error,
  empty,
  getKey,
  onRowClick,
  selection
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: string | null
  empty?: string
  getKey: (row: T) => string
  onRowClick?: (row: T) => void
  selection?: TableSelection
}) {
  const align = (a?: string) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'
  const colCount = columns.length + (selection ? 1 : 0)
  const allKeys = rows.map(getKey)
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selection?.selected.has(k))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {selection && (
              <th className="w-8 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => selection.onToggleAll(allKeys)}
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-3 font-mono text-[11px] font-normal uppercase tracking-wider text-faint',
                  align(c.align)
                )}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-16 text-center">
                <Spinner className="mx-auto h-5 w-5 text-faint" />
              </td>
            </tr>
          )}
          {error && (
            <tr>
              <td
                colSpan={colCount}
                className="px-4 py-16 text-center text-sm text-red-300"
              >
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td
                colSpan={colCount}
                className="px-4 py-16 text-center text-sm text-faint"
              >
                {empty ?? 'Nothing here yet.'}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const key = getKey(row)
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border-soft transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-hover'
                )}
              >
                {selection && (
                  <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selection.selected.has(key)}
                      onChange={() => selection.onToggle(key)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3 text-[13px] text-muted',
                      align(c.align)
                    )}
                  >
                    {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  onPage
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-md border border-border p-1.5 text-muted enabled:hover:bg-hover disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-mono text-[12px] text-muted">
        {page} <span className="text-faint">/ {totalPages}</span>
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded-md border border-border p-1.5 text-muted enabled:hover:bg-hover disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Drawer({
  open,
  title,
  onClose,
  children
}: {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 pr-4 text-sm font-medium text-fg">
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-inset p-4 font-mono text-[12px] leading-relaxed text-muted">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export function StatusPill({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase()
  const tone =
    s.includes('complete') || s.includes('success') || s.includes('pass') || s === 'ok'
      ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
      : s.includes('error') || s.includes('fail')
        ? 'border-red-900/60 bg-red-950/30 text-red-300'
        : s.includes('run') || s.includes('progress') || s.includes('pending')
          ? 'border-amber-900/60 bg-amber-950/30 text-amber-300'
          : 'border-border bg-inset text-muted'
  return (
    <span
      className={cn(
        'inline-block rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        tone
      )}
    >
      {status ?? '—'}
    </span>
  )
}
