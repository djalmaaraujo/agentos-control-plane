import { useState } from 'react'
import { Bot, User as UserIcon, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import { formatNumber } from '@/lib/format'
import { useApi } from '@/lib/useApi'
import { runsToMessages } from '@/lib/runs'
import { modelLabel } from '@/lib/utils'
import type { Session } from '@/lib/types'
import { PageHeader, DataTable, Pager, Drawer, PrimitiveTag } from '@/components/data'
import { DbTableHeader, ExportMenu } from '@/components/shared'
import { exportCsv, exportJson } from '@/lib/export'
import { Markdown } from '@/components/Markdown'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui'

interface Metrics {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  reasoning_tokens?: number
  cache_read_tokens?: number
  cache_write_tokens?: number
  cost?: number
  details?: { model?: { id?: string; provider?: string; input_tokens?: number; output_tokens?: number; total_tokens?: number }[] }
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="text-[15px] text-fg">{value}</div>
    </div>
  )
}

function RunsTab({ session }: { session: Session }) {
  const isTeam = !!session.team_id
  const { data, loading, error } = useApi<unknown>(
    (s) => api.sessionRuns(session.session_id, s),
    [session.session_id]
  )
  const messages = data ? runsToMessages(data) : []
  if (loading) return <Spinner className="h-4 w-4 text-faint" />
  if (error) return <p className="text-sm text-red-300">{error}</p>
  if (messages.length === 0)
    return <p className="text-sm text-faint">No messages in this session.</p>

  const AssistantIcon = isTeam ? Users : Bot
  return (
    <div className="space-y-6">
      {messages.map((m, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded',
                m.role === 'user' ? 'bg-white text-black' : 'bg-accent text-black'
              )}
            >
              {m.role === 'user' ? (
                <UserIcon className="h-3 w-3" />
              ) : (
                <AssistantIcon className="h-3 w-3" />
              )}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
              {m.role === 'user' ? 'User' : isTeam ? 'Team' : 'Assistant'}
            </span>
            <span className="ml-auto font-mono text-[10px] text-faint">
              {formatDateTime(m.at)}
            </span>
          </div>
          <div className="pl-7">
            {m.role === 'assistant' ? (
              <Markdown>{m.content}</Markdown>
            ) : (
              <p className="whitespace-pre-wrap text-[14px] text-fg">
                {m.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricsTab({ metrics }: { metrics?: Metrics }) {
  if (!metrics) return <p className="text-sm text-faint">No metrics.</p>
  const model = metrics.details?.model?.[0]
  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">General tokens</div>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Input" value={formatNumber(metrics.input_tokens)} />
          <Stat label="Output" value={formatNumber(metrics.output_tokens)} />
          <Stat label="Total" value={formatNumber(metrics.total_tokens)} />
        </div>
      </div>
      <div>
        <div className="label mb-2">Cache</div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Read" value={formatNumber(metrics.cache_read_tokens)} />
          <Stat label="Write" value={formatNumber(metrics.cache_write_tokens)} />
        </div>
      </div>
      <div>
        <div className="label mb-2">Reasoning</div>
        <Stat label="Tokens" value={formatNumber(metrics.reasoning_tokens)} />
      </div>
      {model && (
        <div>
          <div className="label mb-2">Model</div>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="ID" value={<span className="font-mono text-[13px]">{model.id}</span>} />
            <Stat label="Provider" value={model.provider} />
          </div>
        </div>
      )}
      {typeof metrics.cost === 'number' && (
        <Stat label="Cost (USD)" value={`$${metrics.cost.toFixed(6)}`} />
      )}
    </div>
  )
}

function DetailsTab({ session }: { session: Session }) {
  const metrics = session.metrics as Metrics | undefined
  const model = metrics?.details?.model?.[0]
  return (
    <div className="space-y-6">
      <div>
        <div className="label mb-2">Component</div>
        <PrimitiveTag agentId={session.agent_id} teamId={session.team_id} workflowId={session.workflow_id} />
      </div>
      {model && (
        <div>
          <div className="label mb-2">Model</div>
          <div className="font-mono text-[13px] text-muted">
            {modelLabel({ id: model.id, provider: model.provider })}
          </div>
        </div>
      )}
      <Field label="Session ID" value={session.session_id} mono />
      <Field label="User ID" value={session.user_id ?? '—'} mono />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Created at" value={formatDateTime(session.created_at)} />
        <Field label="Last updated" value={formatDateTime(session.updated_at)} />
      </div>
    </div>
  )
}

function SessionDetail({ session }: { session: Session }) {
  const [tab, setTab] = useState<'runs' | 'metrics' | 'details'>('runs')
  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-6 border-b border-border px-1">
        {(['runs', 'metrics', 'details'] as const).map((t) => (
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
      </div>
      <div className="flex-1 overflow-y-auto pt-5">
        {tab === 'runs' && <RunsTab session={session} />}
        {tab === 'metrics' && <MetricsTab metrics={session.metrics as Metrics} />}
        {tab === 'details' && <DetailsTab session={session} />}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono
}: {
  label: string
  value?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className={mono ? 'break-all font-mono text-[12px] text-muted' : 'text-muted'}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export function Sessions() {
  const { config } = useOS()
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<Session | null>(null)
  const { rows, meta, loading, error, page, setPage } = usePaginatedList<Session>(
    (params, s) => api.sessions(params, s),
    { limit: 25, params: { type, sort_by: 'updated_at', sort_order: 'desc' } }
  )

  return (
    <div>
      <PageHeader
        title="Sessions"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-hover"
            >
              <option value="">All</option>
              <option value="agent">Agents</option>
              <option value="team">Teams</option>
              <option value="workflow">Workflows</option>
            </select>
            <ExportMenu
              onCsv={() =>
                exportCsv(
                  'sessions',
                  rows.map((r) => ({
                    session_id: r.session_id,
                    session_name: r.session_name,
                    user_id: r.user_id,
                    agent_id: r.agent_id,
                    team_id: r.team_id,
                    updated_at: r.updated_at
                  }))
                )
              }
              onJson={() => exportJson('sessions', rows)}
            />
          </div>
        }
      >
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: 'agno_sessions' },
            { label: 'Total', value: meta?.total_count ?? '—' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<Session>
          columns={[
            {
              key: 'session_name',
              header: 'Session name',
              render: (r) => (
                <span className="text-fg">
                  {r.session_name || <span className="text-faint">Untitled</span>}
                </span>
              )
            },
            { key: 'user_id', header: 'User ID', render: (r) => r.user_id || '—' },
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
              key: 'updated_at',
              header: 'Updated at',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.updated_at)}
                </span>
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="No sessions yet."
          getKey={(r) => r.session_id}
          onRowClick={setSelected}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer
        open={!!selected}
        title={
          <span className="font-mono text-[13px]">
            {selected?.session_name || selected?.session_id}
          </span>
        }
        onClose={() => setSelected(null)}
      >
        {selected && <SessionDetail session={selected} />}
      </Drawer>
    </div>
  )
}
