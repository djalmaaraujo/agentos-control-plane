import { useState } from 'react'
import { Plus, SlidersHorizontal, X } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useApi } from '@/lib/useApi'
import { useOS } from '@/lib/osContext'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Trace, TraceFilterSchema, TraceSessionStat } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  PrimitiveTag,
  StatusPill
} from '@/components/data'
import { DbTableHeader, ExportMenu, TimeRange } from '@/components/shared'
import { rangeParams, type TimeRangeKey } from '@/lib/timeRange'
import { exportCsv, exportJson } from '@/lib/export'
import { TraceDetail } from './TraceDetail'
import { cn } from '@/lib/utils'

interface Condition {
  key: string
  op: string
  value: string
}

function buildTraceFilter(conds: Condition[]): unknown | null {
  const valid = conds.filter((c) => c.key && c.op && c.value.trim())
  if (!valid.length) return null
  const nodes = valid.map((c) =>
    c.op === 'IN'
      ? { op: 'IN', key: c.key, values: c.value.split(',').map((v) => v.trim()).filter(Boolean) }
      : { op: c.op, key: c.key, value: c.value.trim() }
  )
  return nodes.length === 1 ? nodes[0] : { op: 'AND', conditions: nodes }
}

function FilterBar({
  schema,
  onApply
}: {
  schema?: TraceFilterSchema
  onApply: (filter: unknown | null) => void
}) {
  const fields = schema?.fields ?? []
  const [conds, setConds] = useState<Condition[]>([{ key: '', op: '', value: '' }])

  const setCond = (i: number, patch: Partial<Condition>) =>
    setConds((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const field = (key: string) => fields.find((f) => f.key === key)

  return (
    <div className="space-y-2 border-b border-border-soft px-8 py-3">
      {conds.map((c, i) => {
        const f = field(c.key)
        return (
          <div key={i} className="flex items-center gap-2">
            <select
              value={c.key}
              onChange={(e) =>
                setCond(i, { key: e.target.value, op: field(e.target.value)?.operators[0] ?? '', value: '' })
              }
              className="rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-fg outline-none"
            >
              <option value="">Field…</option>
              {fields.map((fl) => (
                <option key={fl.key} value={fl.key}>
                  {fl.label}
                </option>
              ))}
            </select>
            <select
              value={c.op}
              onChange={(e) => setCond(i, { op: e.target.value })}
              disabled={!f}
              className="rounded-md border border-border bg-panel px-2 py-1.5 font-mono text-[11px] text-muted outline-none disabled:opacity-40"
            >
              {(f?.operators ?? []).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            {f?.values ? (
              <select
                value={c.value}
                onChange={(e) => setCond(i, { value: e.target.value })}
                className="rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-fg outline-none"
              >
                <option value="">Value…</option>
                {f.values.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={c.value}
                onChange={(e) => setCond(i, { value: e.target.value })}
                placeholder={c.op === 'IN' ? 'a, b, c' : 'value'}
                disabled={!f}
                className="w-48 rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-fg outline-none disabled:opacity-40"
              />
            )}
            <button
              onClick={() => setConds((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs))}
              className="rounded p-1 text-faint hover:text-red-300"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => setConds((cs) => [...cs, { key: '', op: '', value: '' }])}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-faint hover:text-fg"
        >
          <Plus className="h-3 w-3" /> Condition
        </button>
        <button
          onClick={() => onApply(buildTraceFilter(conds))}
          className="ml-auto rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
        >
          Apply
        </button>
        <button
          onClick={() => {
            setConds([{ key: '', op: '', value: '' }])
            onApply(null)
          }}
          className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:bg-hover hover:text-fg"
        >
          Clear
        </button>
      </div>
      <p className="font-mono text-[10px] text-faint">
        Multiple conditions are combined with AND.
      </p>
    </div>
  )
}

export function Traces() {
  const { config } = useOS()
  const [tab, setTab] = useState<'sessions' | 'runs'>('runs')
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<TimeRangeKey>('all')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [filter, setFilter] = useState<unknown | null>(null)

  const filterSchema = useApi<TraceFilterSchema>(
    (s) => api.traceFilterSchema(s),
    []
  )

  const runs = usePaginatedList<Trace>(
    (params, s) =>
      params.filter
        ? api.tracesSearch(
            { filter: params.filter, page: params.page as number, limit: params.limit as number },
            s
          )
        : api.traces(params, s),
    {
      limit: 25,
      params: filter
        ? { filter }
        : { ...rangeParams(range), ...(sessionId ? { session_id: sessionId } : {}) },
      enabled: tab === 'runs'
    }
  )
  const sessions = usePaginatedList<TraceSessionStat>(
    (params, s) => api.traceSessionStats(params, s),
    { limit: 25, enabled: tab === 'sessions' }
  )

  if (openId) {
    return <TraceDetail traceId={openId} onBack={() => setOpenId(null)} />
  }

  const q = query.toLowerCase().trim()
  const runRows = q
    ? runs.rows.filter((r) =>
        `${r.name} ${r.input} ${r.session_id} ${r.run_id} ${r.agent_id} ${r.team_id}`
          .toLowerCase()
          .includes(q)
      )
    : runs.rows
  const sessRows = q
    ? sessions.rows.filter((r) =>
        `${r.session_id} ${r.workflow_id} ${r.user_id}`.toLowerCase().includes(q)
      )
    : sessions.rows

  return (
    <div>
      <PageHeader
        title="Traces"
        actions={
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="w-56 rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-fg outline-none focus:border-accent"
            />
            <TimeRange value={range} onChange={setRange} />
            {tab === 'runs' && (
              <button
                onClick={() => setAdvanced((a) => !a)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px]',
                  advanced || filter
                    ? 'border-accent/60 bg-accent-dim text-accent'
                    : 'border-border text-muted hover:bg-hover hover:text-fg'
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            )}
            <ExportMenu
              onCsv={() =>
                tab === 'runs'
                  ? exportCsv('traces', runRows as unknown as Record<string, unknown>[])
                  : exportCsv('trace-sessions', sessRows as unknown as Record<string, unknown>[])
              }
              onJson={() =>
                tab === 'runs' ? exportJson('traces', runRows) : exportJson('trace-sessions', sessRows)
              }
            />
          </div>
        }
      >
        <DbTableHeader items={[{ label: 'Database', value: config?.os_database }]} />
      </PageHeader>

      <div className="flex items-center gap-6 border-b border-border-soft px-8">
        {(['sessions', 'runs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 py-2.5 font-mono text-[11px] uppercase tracking-wider',
              tab === t ? 'border-accent text-fg' : 'border-transparent text-faint hover:text-muted'
            )}
          >
            {t}
          </button>
        ))}
        {sessionId && (
          <button
            onClick={() => setSessionId(null)}
            className="ml-auto flex items-center gap-1.5 self-center rounded border border-border px-2 py-1 font-mono text-[10px] text-muted hover:text-fg"
          >
            session: {sessionId.slice(0, 14)}… <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {tab === 'runs' && advanced && (
        <FilterBar schema={filterSchema.data ?? undefined} onApply={setFilter} />
      )}

      <div className="px-8 py-2">
        {tab === 'runs' ? (
          <>
            <DataTable<Trace>
              columns={[
                {
                  key: 'name',
                  header: 'Trace',
                  render: (r) => (
                    <div className="min-w-0">
                      <div className="truncate text-fg">{r.name || r.trace_id}</div>
                      {r.input && (
                        <div className="max-w-md truncate text-[11px] text-faint">{r.input}</div>
                      )}
                    </div>
                  )
                },
                { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
                {
                  key: 'primitive',
                  header: 'Primitive',
                  render: (r) => (
                    <PrimitiveTag agentId={r.agent_id} teamId={r.team_id} workflowId={r.workflow_id} />
                  )
                },
                {
                  key: 'total_spans',
                  header: 'Spans',
                  align: 'right',
                  render: (r) => (
                    <span className="font-mono text-[12px]">
                      {r.total_spans ?? 0}
                      {r.error_count ? <span className="text-red-400"> · {r.error_count} err</span> : null}
                    </span>
                  )
                },
                {
                  key: 'duration',
                  header: 'Duration',
                  align: 'right',
                  render: (r) => (
                    <span className="font-mono text-[12px]">{formatDuration(r.duration)}</span>
                  )
                },
                {
                  key: 'start_time',
                  header: 'Started',
                  align: 'right',
                  render: (r) => (
                    <span className="font-mono text-[12px] text-faint">
                      {formatDateTime(r.start_time || r.created_at)}
                    </span>
                  )
                }
              ]}
              rows={runRows}
              loading={runs.loading}
              error={runs.error}
              empty="No traces yet."
              getKey={(r) => r.trace_id}
              onRowClick={(r) => setOpenId(r.trace_id)}
            />
            <Pager page={runs.page} totalPages={runs.meta?.total_pages ?? 1} onPage={runs.setPage} />
          </>
        ) : (
          <>
            <DataTable<TraceSessionStat>
              columns={[
                {
                  key: 'session_id',
                  header: 'Session ID',
                  render: (r) => (
                    <span className="font-mono text-[12px] text-fg">{r.session_id}</span>
                  )
                },
                { key: 'user_id', header: 'User', render: (r) => r.user_id || '—' },
                {
                  key: 'primitive',
                  header: 'Primitive',
                  render: (r) => (
                    <PrimitiveTag agentId={r.agent_id} teamId={r.team_id} workflowId={r.workflow_id} />
                  )
                },
                {
                  key: 'total_traces',
                  header: 'Traces',
                  align: 'right',
                  render: (r) => <span className="font-mono text-[12px]">{r.total_traces ?? 0}</span>
                },
                {
                  key: 'first_trace_at',
                  header: 'First trace',
                  align: 'right',
                  render: (r) => (
                    <span className="font-mono text-[12px] text-faint">{formatDateTime(r.first_trace_at)}</span>
                  )
                },
                {
                  key: 'last_trace_at',
                  header: 'Last trace',
                  align: 'right',
                  render: (r) => (
                    <span className="font-mono text-[12px] text-faint">{formatDateTime(r.last_trace_at)}</span>
                  )
                }
              ]}
              rows={sessRows}
              loading={sessions.loading}
              error={sessions.error}
              empty="No sessions yet."
              getKey={(r) => r.session_id}
              onRowClick={(r) => {
                setSessionId(r.session_id)
                setTab('runs')
              }}
            />
            <Pager
              page={sessions.page}
              totalPages={sessions.meta?.total_pages ?? 1}
              onPage={sessions.setPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
