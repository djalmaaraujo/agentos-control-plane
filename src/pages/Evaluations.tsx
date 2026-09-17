import { useState } from 'react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import { modelLabel } from '@/lib/utils'
import type { EvalRun } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  Drawer,
  PrimitiveTag,
  StatusPill
} from '@/components/data'
import { DbTableHeader } from '@/components/shared'
import { cn } from '@/lib/utils'

function Chips({
  label,
  items,
  tone
}: {
  label: string
  items?: string[]
  tone: 'ok' | 'bad' | 'muted'
}) {
  if (!items || items.length === 0) return null
  const cls =
    tone === 'ok'
      ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
      : tone === 'bad'
        ? 'border-red-900/60 bg-red-950/30 text-red-300'
        : 'border-border bg-inset text-muted'
  return (
    <div>
      <div className="label mb-1.5">
        {label} <span className="text-faint">{items.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t, i) => (
          <span key={i} className={cn('rounded border px-2 py-1 font-mono text-[11px]', cls)}>
            {t}
          </span>
        ))}
      </div>
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

interface JudgeResult {
  input?: string
  output?: string
  score?: number | null
  passed?: boolean
  reason?: string
}

function EvalDetail({ run }: { run: EvalRun }) {
  const ed = (run.eval_data ?? {}) as Record<string, unknown>
  const ei = (run.eval_input ?? {}) as Record<string, unknown>
  const isJudge = run.eval_type === 'agent_as_judge'
  const results = (ed.results as JudgeResult[] | undefined) ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" value={<span className="font-mono uppercase">{run.eval_type}</span>} />
        <Field label="Status" value={<StatusPill status={ed.eval_status as string} />} />
        <Field
          label="Component"
          value={<PrimitiveTag agentId={run.agent_id} teamId={run.team_id} workflowId={run.workflow_id} />}
        />
        <Field label="Model" value={modelLabel({ id: run.model_id, provider: run.model_provider })} />
        <Field label="Created" value={formatDateTime(run.created_at)} />
      </div>

      {isJudge ? (
        <>
          <div>
            <div className="label mb-2">Scores</div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Avg" value={fmtScore(ed.avg_score)} />
              <Field label="Pass rate" value={ed.pass_rate != null ? `${Math.round(Number(ed.pass_rate) * 100)}%` : '—'} />
              <Field label="Min" value={fmtScore(ed.min_score)} />
              <Field label="Max" value={fmtScore(ed.max_score)} />
            </div>
          </div>
          <div className="space-y-3">
            <div className="label">Results {results.length > 0 && <span className="text-faint">{results.length}</span>}</div>
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-inset p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase',
                      r.passed
                        ? 'border-emerald-900/60 text-emerald-300'
                        : 'border-red-900/60 text-red-300'
                    )}
                  >
                    {r.passed ? 'Pass' : 'Fail'}
                  </span>
                  {r.score != null && (
                    <span className="font-mono text-[11px] text-faint">score {r.score}</span>
                  )}
                </div>
                {r.input && <p className="mb-1 text-[13px] text-fg">{r.input}</p>}
                {r.output && <p className="mb-1 text-[12px] text-muted">{r.output}</p>}
                {r.reason && <p className="text-[12px] italic text-faint">{r.reason}</p>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <Chips label="Expected tool calls" items={ei.expected_tool_calls as string[]} tone="muted" />
          <Chips label="Passed tool calls" items={ed.passed_tool_calls as string[]} tone="ok" />
          <Chips label="Failed tool calls" items={ed.failed_tool_calls as string[]} tone="bad" />
          <Chips label="Missing tool calls" items={ed.missing_tool_calls as string[]} tone="bad" />
          <Chips label="Additional tool calls" items={ed.additional_tool_calls as string[]} tone="muted" />
          <Chips label="Passed argument checks" items={ed.passed_argument_checks as string[]} tone="ok" />
          <Chips label="Failed argument checks" items={ed.failed_argument_checks as string[]} tone="bad" />
        </>
      )}
    </div>
  )
}

function fmtScore(v: unknown): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toFixed(2)
}

export function Evaluations() {
  const { config } = useOS()
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<EvalRun | null>(null)
  const { rows, meta, loading, error, page, setPage } = usePaginatedList<EvalRun>(
    (params, s) => api.evalRuns(params, s),
    { limit: 25, params: { eval_types: type } }
  )

  return (
    <div>
      <PageHeader
        title="Evaluations"
        actions={
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-hover"
          >
            <option value="">All types</option>
            <option value="reliability">Reliability</option>
            <option value="agent_as_judge">Agent as judge</option>
            <option value="accuracy">Accuracy</option>
          </select>
        }
      >
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: 'agno_eval_runs' },
            { label: 'Total', value: meta?.total_count ?? '—' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<EvalRun>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => (
                <span className="text-fg">
                  {r.name || r.evaluated_component_name || r.id}
                </span>
              )
            },
            {
              key: 'eval_type',
              header: 'Type',
              render: (r) => (
                <span className="font-mono text-[11px] uppercase text-muted">
                  {r.eval_type || '—'}
                </span>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusPill status={r.eval_data?.eval_status as string} />
            },
            {
              key: 'component',
              header: 'Component',
              render: (r) => (
                <PrimitiveTag agentId={r.agent_id} teamId={r.team_id} workflowId={r.workflow_id} />
              )
            },
            {
              key: 'model',
              header: 'Model',
              render: (r) => (
                <span className="font-mono text-[11px] text-faint">
                  {modelLabel({ id: r.model_id, provider: r.model_provider }) || '—'}
                </span>
              )
            },
            {
              key: 'created_at',
              header: 'Created',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.created_at)}
                </span>
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="No evaluation runs yet."
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
        {selected && <EvalDetail run={selected} />}
      </Drawer>
    </div>
  )
}
