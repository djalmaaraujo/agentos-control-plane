import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { useOS } from '@/lib/osContext'
import { formatCompact } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DailyMetric, MetricsResponse } from '@/lib/types'
import { PageHeader } from '@/components/data'
import { DbTableHeader, ExportMenu } from '@/components/shared'
import { exportCsv, exportJson } from '@/lib/export'
import { Spinner, ErrorState } from '@/components/ui'
import { BarChart, Donut, LineChart } from '@/components/charts'

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
]

function monthRange(year: number, month: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${year}-${pad(month + 1)}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`
  return { start, end, days: lastDay }
}

function seriesByDay(
  metrics: DailyMetric[],
  days: number,
  pick: (m: DailyMetric) => number
): number[] {
  const arr = new Array(days).fill(0)
  for (const m of metrics) {
    const d = new Date(m.date).getUTCDate()
    if (d >= 1 && d <= days) arr[d - 1] += pick(m)
  }
  return arr
}

function Card({
  title,
  total,
  children
}: {
  title: string
  total: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-[15px] font-medium text-fg">{title}</h3>
        <span className="text-xl font-semibold text-fg">{total}</span>
      </div>
      {children}
    </div>
  )
}

export function Metrics() {
  const { serverKey, refreshNonce, config } = useOS()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const { start, end, days } = useMemo(() => monthRange(year, month), [year, month])

  const [recalculating, setRecalculating] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null)
  const { data, loading, error, reload } = useApi<MetricsResponse>(
    (s) => api.metrics({ starting_date: start, ending_date: end }, s),
    [serverKey, refreshNonce, start, end]
  )

  const recalculate = async () => {
    setRecalculating(true)
    setRefreshStatus(null)
    try {
      await api.refreshMetrics()
      const busy = ['running', 'in_progress', 'pending', 'processing']
      for (let i = 0; i < 30; i++) {
        const st = await api.metricsRefreshStatus()
        setRefreshStatus(st.status)
        if (!busy.includes(st.status)) break
        await new Promise((r) => setTimeout(r, 1000))
      }
      reload()
    } finally {
      setRecalculating(false)
      setTimeout(() => setRefreshStatus(null), 3000)
    }
  }

  const metrics = useMemo(() => data?.metrics ?? [], [data])

  const sum = (pick: (m: DailyMetric) => number) =>
    metrics.reduce((a, m) => a + pick(m), 0)

  const modelRuns = useMemo(() => {
    const byModel: Record<string, number> = {}
    for (const m of metrics) {
      for (const mm of m.model_metrics ?? []) {
        byModel[mm.model_id] = (byModel[mm.model_id] ?? 0) + mm.count
      }
    }
    const entries = Object.entries(byModel).sort((a, b) => b[1] - a[1])
    const top = entries.slice(0, 5)
    const rest = entries.slice(5).reduce((a, [, v]) => a + v, 0)
    const segments = top.map(([label, value]) => ({ label, value }))
    if (rest > 0) segments.push({ label: 'Others', value: rest })
    return { segments, total: entries.reduce((a, [, v]) => a + v, 0) }
  }, [metrics])

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const tokens = (m: DailyMetric) => m.token_metrics?.total_tokens ?? 0

  return (
    <div>
      <PageHeader
        title="Metrics"
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              onCsv={() =>
                exportCsv(
                  `metrics-${MONTHS[month].toLowerCase()}-${year}`,
                  metrics as unknown as Record<string, unknown>[]
                )
              }
              onJson={() => exportJson(`metrics-${MONTHS[month].toLowerCase()}-${year}`, metrics)}
            />
            <button
              onClick={recalculate}
              disabled={recalculating}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
            >
              <RotateCw className={cn('h-3.5 w-3.5', recalculating && 'animate-spin')} />
              Recalculate
            </button>
            {refreshStatus && (
              <span
                className={cn(
                  'font-mono text-[11px] uppercase tracking-wider',
                  refreshStatus === 'completed'
                    ? 'text-emerald-400'
                    : refreshStatus === 'failed' || refreshStatus === 'error'
                      ? 'text-red-300'
                      : 'text-faint'
                )}
              >
                {refreshStatus}
              </span>
            )}
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => shiftMonth(-1)} className="p-1.5 text-muted hover:bg-hover">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono text-[12px] text-muted">
                {MONTHS[month]} {year}
              </span>
              <button onClick={() => shiftMonth(1)} className="p-1.5 text-muted hover:bg-hover">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: 'agno_metrics' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-6">
        {loading && !data && (
          <div className="flex justify-center py-20">
            <Spinner className="h-5 w-5 text-faint" />
          </div>
        )}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Total tokens" total={formatCompact(sum(tokens))}>
              <BarChart values={seriesByDay(metrics, days, tokens)} />
            </Card>
            <Card title="Users" total={formatCompact(Math.max(0, ...metrics.map((m) => m.users_count ?? 0)))}>
              <BarChart values={seriesByDay(metrics, days, (m) => m.users_count ?? 0)} />
            </Card>
            <Card title="Agent Runs" total={formatCompact(sum((m) => m.agent_runs_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.agent_runs_count ?? 0)} />
            </Card>
            <Card title="Agent Sessions" total={formatCompact(sum((m) => m.agent_sessions_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.agent_sessions_count ?? 0)} />
            </Card>
            <Card title="Team Runs" total={formatCompact(sum((m) => m.team_runs_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.team_runs_count ?? 0)} />
            </Card>
            <Card title="Team Sessions" total={formatCompact(sum((m) => m.team_sessions_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.team_sessions_count ?? 0)} />
            </Card>
            <Card title="Workflow Runs" total={formatCompact(sum((m) => m.workflow_runs_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.workflow_runs_count ?? 0)} />
            </Card>
            <Card title="Workflow Sessions" total={formatCompact(sum((m) => m.workflow_sessions_count ?? 0))}>
              <LineChart values={seriesByDay(metrics, days, (m) => m.workflow_sessions_count ?? 0)} />
            </Card>
            {modelRuns.total > 0 && (
              <Card title="Model runs" total={formatCompact(modelRuns.total)}>
                <Donut segments={modelRuns.segments} total={modelRuns.total} />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
