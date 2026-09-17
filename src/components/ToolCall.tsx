import { useState } from 'react'
import { Check, ChevronRight, Loader2, Wrench, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChatToolCall {
  id: string
  name: string
  args?: unknown
  result?: string
  error?: boolean
  done: boolean
}

function pretty(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') {
    try {
      return JSON.stringify(JSON.parse(v), null, 2)
    } catch {
      return v
    }
  }
  return JSON.stringify(v, null, 2)
}

export function ToolCallView({ call }: { call: ChatToolCall }) {
  const [open, setOpen] = useState(false)
  const hasArgs = !!call.args && Object.keys(call.args as object).length > 0
  return (
    <div className="rounded-lg border border-border bg-inset">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 text-faint transition-transform', open && 'rotate-90')}
        />
        <Wrench className="h-3.5 w-3.5 text-sky-400" />
        <span className="flex-1 truncate font-mono text-[12px] text-fg">
          {call.name}
        </span>
        {!call.done ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
        ) : call.error ? (
          <X className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        )}
      </button>
      {open && (
        <div className="space-y-2 border-t border-border px-3 py-2.5">
          {hasArgs && (
            <div>
              <div className="label mb-1">Arguments</div>
              <pre className="overflow-x-auto rounded border border-border bg-inset p-2 font-mono text-[11px] text-muted">
                {pretty(call.args)}
              </pre>
            </div>
          )}
          {call.result && (
            <div>
              <div className="label mb-1">Result</div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded border border-border bg-inset p-2 font-mono text-[11px] text-muted">
                {pretty(call.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
