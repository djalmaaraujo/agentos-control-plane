import { useState } from 'react'
import { Loader2, Play, Plus, Power } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useApi } from '@/lib/useApi'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import type { Schedule, ScheduleRun } from '@/lib/types'
import { PageHeader, DataTable, Pager, Drawer, StatusPill } from '@/components/data'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

function ScheduleForm({ onSaved }: { onSaved: () => void }) {
  const { config } = useOS()
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'agent' | 'team' | 'workflow'>('agent')
  const [targetId, setTargetId] = useState('')
  const [message, setMessage] = useState('')
  const [cron, setCron] = useState('0 9 * * *')
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list =
    (kind === 'team' ? config?.teams : kind === 'workflow' ? config?.workflows : config?.agents) ??
    []
  const base = kind === 'team' ? 'teams' : kind === 'workflow' ? 'workflows' : 'agents'
  const id = targetId || list[0]?.id

  const save = async () => {
    if (!name.trim() || !id || !cron.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.createSchedule({
        name: name.trim(),
        cron_expr: cron.trim(),
        endpoint: `/${base}/${id}/runs`,
        method: 'POST',
        payload: { message },
        timezone: tz
      })
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-1.5">Name</div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label mb-1.5">Target type</div>
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as 'agent' | 'team' | 'workflow')
              setTargetId('')
            }}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-muted outline-none"
          >
            <option value="agent">Agent</option>
            <option value="team">Team</option>
            <option value="workflow">Workflow</option>
          </select>
        </div>
        <div>
          <div className="label mb-1.5">Target</div>
          <select
            value={id}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none"
          >
            {list.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <div className="label mb-1.5">Message</div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label mb-1.5">Cron</div>
          <input
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 font-mono text-sm text-fg outline-none focus:border-accent"
          />
        </div>
        <div>
          <div className="label mb-1.5">Timezone</div>
          <input
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 font-mono text-sm text-fg outline-none focus:border-accent"
          />
        </div>
      </div>
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={save}
        disabled={busy || !name.trim() || !id}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Create schedule
      </button>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="text-[13px] text-muted">{value ?? '—'}</div>
    </div>
  )
}

function ScheduleDetail({ schedule }: { schedule: Schedule }) {
  const { data, loading } = useApi(
    (s) => api.scheduleRuns(schedule.id, { limit: 20 }, s),
    [schedule.id]
  )
  const runs = data?.data ?? []
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Cron" value={<span className="font-mono text-[12px]">{schedule.cron_expr}</span>} />
        <Field label="Timezone" value={schedule.timezone} />
        <Field label="Next run" value={formatDateTime(schedule.next_run_at)} />
        <Field
          label="State"
          value={
            <span className={schedule.enabled ? 'text-emerald-400' : 'text-faint'}>
              {schedule.enabled ? 'Enabled' : 'Disabled'}
            </span>
          }
        />
      </div>
      {schedule.description && <Field label="Description" value={schedule.description} />}
      {schedule.payload?.message != null && (
        <Field
          label="Message"
          value={<span className="text-[13px]">{String(schedule.payload.message)}</span>}
        />
      )}
      <div>
        <div className="label mb-2">
          Run history {data?.meta?.total_count != null && <span className="text-faint">{data.meta.total_count}</span>}
        </div>
        {loading && <Spinner className="h-4 w-4 text-faint" />}
        {!loading && runs.length === 0 && (
          <p className="text-sm text-faint">No runs yet.</p>
        )}
        <div className="space-y-2">
          {runs.map((r: ScheduleRun) => (
            <div key={r.id} className="rounded-lg border border-border-soft bg-inset p-3">
              <div className="mb-1 flex items-center gap-2">
                <StatusPill status={r.status} />
                {r.status_code != null && (
                  <span className="font-mono text-[11px] text-faint">HTTP {r.status_code}</span>
                )}
                <span className="ml-auto font-mono text-[11px] text-faint">
                  {formatDateTime(r.triggered_at)}
                </span>
              </div>
              {r.output?.content && (
                <p className="line-clamp-2 text-[12px] text-muted">{r.output.content}</p>
              )}
              {r.error && <p className="text-[12px] text-red-300">{r.error}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Scheduler() {
  const [selected, setSelected] = useState<Schedule | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const { rows, meta, loading, error, page, setPage, reload } =
    usePaginatedList<Schedule>((params, s) => api.schedules(params, s), {
      limit: 25
    })

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id)
    try {
      await fn()
      reload()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Scheduler"
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New schedule
          </button>
        }
      >
        <span className="text-[12px] text-faint">
          {meta?.total_count ?? 0} schedules
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<Schedule>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <div className="min-w-0">
                  <div className="text-fg">{r.name || r.id}</div>
                  {r.description && (
                    <div className="max-w-md truncate text-[11px] text-faint">
                      {r.description}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'cron_expr',
              header: 'Cron',
              render: (r) => (
                <span className="font-mono text-[12px] text-muted">
                  {r.cron_expr} <span className="text-faint">{r.timezone}</span>
                </span>
              )
            },
            {
              key: 'next_run_at',
              header: 'Next run',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.next_run_at)}
                </span>
              )
            },
            {
              key: 'enabled',
              header: 'State',
              render: (r) => (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 font-mono text-[11px] uppercase',
                    r.enabled ? 'text-emerald-400' : 'text-faint'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      r.enabled ? 'bg-emerald-400' : 'bg-faint'
                    )}
                  />
                  {r.enabled ? 'Enabled' : 'Disabled'}
                </span>
              )
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) => (
                <div
                  className="flex justify-end gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={busy === r.id}
                    title="Trigger now"
                    onClick={() => act(r.id, () => api.triggerSchedule(r.id))}
                    className="rounded border border-border p-1.5 text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={busy === r.id}
                    title={r.enabled ? 'Disable' : 'Enable'}
                    onClick={() =>
                      act(r.id, () =>
                        r.enabled
                          ? api.disableSchedule(r.id)
                          : api.enableSchedule(r.id)
                      )
                    }
                    className={cn(
                      'rounded border border-border p-1.5 hover:bg-hover disabled:opacity-40',
                      r.enabled ? 'text-emerald-400' : 'text-faint hover:text-fg'
                    )}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="No schedules yet."
          getKey={(r) => r.id}
          onRowClick={setSelected}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer open={creating} title="New schedule" onClose={() => setCreating(false)}>
        <ScheduleForm
          onSaved={() => {
            setCreating(false)
            reload()
          }}
        />
      </Drawer>

      <Drawer
        open={!!selected}
        title={<span className="font-mono text-[13px]">{selected?.name}</span>}
        onClose={() => setSelected(null)}
      >
        {selected && <ScheduleDetail schedule={selected} />}
      </Drawer>
    </div>
  )
}
