import { useState } from 'react'
import { Play, Power } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useApi } from '@/lib/useApi'
import { formatDateTime } from '@/lib/format'
import type { Schedule, ScheduleRun } from '@/lib/types'
import { PageHeader, DataTable, Pager, Drawer, StatusPill } from '@/components/data'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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
            <div key={r.id} className="rounded-lg border border-border-soft bg-black/30 p-3">
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
      <PageHeader title="Scheduler">
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
                  <div className="text-white">{r.name || r.id}</div>
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
                    className="rounded border border-border p-1.5 text-muted hover:bg-white/5 hover:text-white disabled:opacity-40"
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
                      'rounded border border-border p-1.5 hover:bg-white/5 disabled:opacity-40',
                      r.enabled ? 'text-emerald-400' : 'text-faint hover:text-white'
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
