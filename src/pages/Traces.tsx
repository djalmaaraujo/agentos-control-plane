import { useState } from 'react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Trace } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  PrimitiveTag,
  StatusPill
} from '@/components/data'
import { TraceDetail } from './TraceDetail'

export function Traces() {
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const { rows, meta, loading, error, page, setPage } = usePaginatedList<Trace>(
    (params, s) => api.traces(params, s),
    { limit: 25, params: { status } }
  )

  if (openId) {
    return <TraceDetail traceId={openId} onBack={() => setOpenId(null)} />
  }

  return (
    <div>
      <PageHeader
        title="Traces"
        actions={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-white/5"
          >
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="ERROR">Error</option>
            <option value="RUNNING">Running</option>
          </select>
        }
      >
        <span className="text-[12px] text-faint">
          Total <span className="text-muted">{meta?.total_count ?? '—'}</span>
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<Trace>
          columns={[
            {
              key: 'name',
              header: 'Trace',
              render: (r) => (
                <div className="min-w-0">
                  <div className="truncate text-white">{r.name || r.trace_id}</div>
                  {r.input && (
                    <div className="max-w-md truncate text-[11px] text-faint">
                      {r.input}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusPill status={r.status} />
            },
            {
              key: 'primitive',
              header: 'Primitive',
              render: (r) => (
                <PrimitiveTag
                  agentId={r.agent_id}
                  teamId={r.team_id}
                  workflowId={r.workflow_id}
                />
              )
            },
            {
              key: 'total_spans',
              header: 'Spans',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px]">
                  {r.total_spans ?? 0}
                  {r.error_count ? (
                    <span className="text-red-400"> · {r.error_count} err</span>
                  ) : null}
                </span>
              )
            },
            {
              key: 'duration',
              header: 'Duration',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px]">
                  {formatDuration(r.duration)}
                </span>
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
          rows={rows}
          loading={loading}
          error={error}
          empty="No traces yet."
          getKey={(r) => r.trace_id}
          onRowClick={(r) => setOpenId(r.trace_id)}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>
    </div>
  )
}
