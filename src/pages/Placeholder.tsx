import type { LucideIcon } from 'lucide-react'

export function Placeholder({
  title,
  icon: Icon,
  note
}: {
  title: string
  icon: LucideIcon
  note?: string
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <div className="mt-8 rounded-lg border border-dashed border-border px-6 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          Coming soon
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {note ?? `The ${title} section is not built yet.`}
        </p>
      </div>
    </div>
  )
}
