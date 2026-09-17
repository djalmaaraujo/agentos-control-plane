import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/timeRange'

// A compact Database / Table / … metadata strip used under page headers.
export function DbTableHeader({
  items
}: {
  items: { label: string; value?: ReactNode }[]
}) {
  return (
    <div className="flex items-center gap-8 text-[12px]">
      {items.map((it) => (
        <div key={it.label}>
          <div className="label">{it.label}</div>
          <div className="font-mono text-muted">{it.value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}

// Export button with a CSV / JSON menu. Pass whichever formats apply.
export function ExportMenu({
  onCsv,
  onJson
}: {
  onCsv?: () => void
  onJson?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-32 rounded-md border border-border bg-panel p-1 shadow-xl">
          {onCsv && (
            <button
              onClick={() => {
                onCsv()
                setOpen(false)
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-muted hover:bg-hover hover:text-fg"
            >
              Export CSV
            </button>
          )}
          {onJson && (
            <button
              onClick={() => {
                onJson()
                setOpen(false)
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-muted hover:bg-hover hover:text-fg"
            >
              Export JSON
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TimeRange({
  value,
  onChange
}: {
  value: TimeRangeKey
  onChange: (k: TimeRangeKey) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeRangeKey)}
      className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-hover"
    >
      {TIME_RANGES.map((r) => (
        <option key={r.key} value={r.key}>
          {r.label}
        </option>
      ))}
    </select>
  )
}

// Big centered empty state with a primary action, for Studio-style pages.
export function PageEmpty({
  icon,
  title,
  subtitle,
  action
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {subtitle && <p className="mt-1 max-w-md text-sm text-muted">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// A responsive card grid, reused by Home and Studio.
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3')}>
      {children}
    </div>
  )
}
