import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Trace, TraceSessionStat } from '@/lib/types'
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

export function Traces() {
  const { config } = useOS()
  const [tab, setTab] = useState<'sessions' | 'runs'>('runs')
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<TimeRangeKey>('all')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const runs = usePaginatedList<Trace>((params, s) => api.traces(params, s), {
    limit: 25,
    params: { ...rangeParams(range), ...(sessionId ? { session_id: sessionId } : {}) },
    enabled: tab === 'runs'
  })
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
