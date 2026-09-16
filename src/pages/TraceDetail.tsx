import { useMemo, useState } from 'react'
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessagesSquare,
  Users,
  Wrench
} from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { TraceDetail as TDetail, TraceSpan } from '@/lib/types'
import { StatusPill } from '@/components/data'
import { Spinner, ErrorState } from '@/components/ui'
import { cn } from '@/lib/utils'

function dur(v?: string | number) {
  if (typeof v === 'string') return v
  return formatDuration(v)
}

function spanIcon(type?: string) {
  const t = (type ?? '').toUpperCase()
  if (t === 'LLM') return { Icon: MessagesSquare, color: 'bg-purple-600' }
  if (t === 'TOOL') return { Icon: Wrench, color: 'bg-sky-600' }
  if (t === 'TEAM') return { Icon: Users, color: 'bg-accent' }
  return { Icon: Bot, color: 'bg-accent' }
}

function CopyField({ label, value }: { label: string; value?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="min-w-0">
      <div className="label mb-1">{label}</div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value ?? '')
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-left hover:bg-white/5"
      >
        <span className="truncate font-mono text-[12px] text-muted">
          {value || '—'}
        </span>
        <Copy className={cn('ml-auto h-3.5 w-3.5 shrink-0', copied ? 'text-emerald-400' : 'text-faint')} />
      </button>
    </div>
  )
}

function flatten(
  spans: TraceSpan[],
  depth: number,
  collapsed: Set<string>,
  out: { span: TraceSpan; depth: number; hasChildren: boolean }[]
) {
  for (const span of spans) {
    const kids = span.spans ?? []
    out.push({ span, depth, hasChildren: kids.length > 0 })
    if (kids.length && !collapsed.has(span.id)) {
      flatten(kids, depth + 1, collapsed, out)
    }
  }
  return out
}

function SpanTree({
  tree,
  selectedId,
  onSelect
}: {
  tree: TraceSpan[]
  selectedId?: string
  onSelect: (s: TraceSpan) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const rows = useMemo(
    () => flatten(tree, 0, collapsed, []),
    [tree, collapsed]
  )

  return (
    <div className="py-1">
      {rows.map(({ span, depth, hasChildren }) => {
        const { Icon, color } = spanIcon(span.type)
        const tokens =
          (span.metadata?.output_tokens as number | undefined) ??
          (span.metadata?.total_tokens as number | undefined)
        return (
          <button
            key={span.id}
            onClick={() => onSelect(span)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md py-2 pr-3 text-left transition-colors hover:bg-white/[0.04]',
              selectedId === span.id && 'bg-white/[0.06]'
            )}
            style={{ paddingLeft: 8 + depth * 20 }}
          >
            {hasChildren ? (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setCollapsed((c) => {
                    const n = new Set(c)
                    if (n.has(span.id)) n.delete(span.id)
                    else n.add(span.id)
                    return n
                  })
                }}
                className="text-faint hover:text-white"
              >
                {collapsed.has(span.id) ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </span>
            ) : (
              <span className="w-3.5" />
            )}
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-black', color)}>
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="flex-1 truncate text-[13px] text-white">
              {span.name}
            </span>
            {typeof tokens === 'number' && (
              <span className="font-mono text-[11px] text-faint">◔ {tokens}</span>
            )}
            <span className="ml-2 font-mono text-[12px] text-muted">
              {dur(span.duration)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Payload({ value }: { value: unknown }) {
  const [formatted, setFormatted] = useState(true)
  const asString = typeof value === 'string' ? value : JSON.stringify(value)
  let pretty = asString
  try {
    pretty = JSON.stringify(
      typeof value === 'string' ? JSON.parse(value) : value,
      null,
      2
    )
  } catch {
    pretty = asString
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-1 rounded-md border border-border p-0.5 text-[10px]">
        <button
          onClick={() => setFormatted(false)}
          className={cn('rounded px-2 py-1 font-mono uppercase', !formatted ? 'bg-white/10 text-white' : 'text-faint')}
        >
          Text
        </button>
        <button
          onClick={() => setFormatted(true)}
          className={cn('rounded px-2 py-1 font-mono uppercase', formatted ? 'bg-white/10 text-white' : 'text-faint')}
        >
          Formatted
        </button>
      </div>
      <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-muted">
        {formatted ? pretty : asString}
      </pre>
    </div>
  )
}

function SpanDetail({ span }: { span: TraceSpan }) {
  const [tab, setTab] = useState<'info' | 'metadata'>('info')
  const { Icon, color } = spanIcon(span.type)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-md text-black', color)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="flex-1 truncate font-semibold text-white">{span.name}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
          latency {dur(span.duration)}
        </span>
        <StatusPill status={span.status} />
      </div>
      <div className="flex gap-6 border-b border-border px-5">
        {(['info', 'metadata'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 py-3 font-mono text-[11px] uppercase tracking-wider',
              tab === t ? 'border-accent text-white' : 'border-transparent text-faint hover:text-muted'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {tab === 'info' ? (
          <>
            {span.input !== undefined && span.input !== null && (
              <div>
                <div className="label mb-2">Input</div>
                <Payload value={span.input} />
              </div>
            )}
            {span.output !== undefined && span.output !== null && (
              <div>
                <div className="label mb-2">Output</div>
                <Payload value={span.output} />
              </div>
            )}
            {span.input == null && span.output == null && (
              <p className="text-sm text-faint">No input or output recorded.</p>
            )}
          </>
        ) : (
          <Metadata meta={span.metadata} />
        )}
      </div>
    </div>
  )
}

function Metadata({ meta }: { meta?: Record<string, unknown> }) {
  if (!meta || Object.keys(meta).length === 0)
    return <p className="text-sm text-faint">No metadata.</p>
  return (
    <div className="space-y-4">
      {Object.entries(meta).map(([k, v]) => (
        <div key={k}>
          <div className="label mb-1">{k.replace(/_/g, ' ')}</div>
          <div className="rounded-lg border border-border bg-black/40 p-3 font-mono text-[12px] text-muted">
            {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TraceDetail({
  traceId,
  onBack
}: {
  traceId: string
  onBack: () => void
}) {
  const { data, loading, error, reload } = useApi<TDetail>(
    (s) => api.trace(traceId, s),
    [traceId]
  )
  const [selected, setSelected] = useState<TraceSpan | null>(null)
  // The root span carries no input/output in the tree — they live at trace level.
  const tree = useMemo(() => {
    const t = data?.tree ?? []
    return t.map((root) => ({
      ...root,
      input: root.input ?? data?.input,
      output: root.output ?? data?.output
    }))
  }, [data])
  const current = selected ?? tree[0]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-soft px-8 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {data?.name ?? 'Trace'}
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-muted">
            {dur(data?.duration)}
          </span>
          <StatusPill status={data?.status} />
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-5 w-5 text-faint" />
        </div>
      )}
      {error && (
        <div className="p-8">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 px-8 py-4 md:grid-cols-5">
            <div>
              <div className="label mb-1">Created at</div>
              <div className="rounded-md border border-border bg-panel px-3 py-2 font-mono text-[12px] text-muted">
                {formatDateTime(data.created_at || data.start_time)}
              </div>
            </div>
            <CopyField label="Trace ID" value={data.trace_id} />
            <CopyField label="Run ID" value={data.run_id} />
            <CopyField label="Session ID" value={data.session_id} />
            <CopyField label="User ID" value={data.user_id} />
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden px-8 pb-8 lg:grid-cols-2">
            <div className="overflow-y-auto rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <span className="label">{data.total_spans ?? tree.length} spans</span>
              </div>
              <SpanTree
                tree={tree}
                selectedId={current?.id}
                onSelect={setSelected}
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {current ? (
                <SpanDetail span={current} />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-faint">
                  Select a span
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
