import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import type { Learning as LearningRow } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  Drawer,
  PrimitiveTag,
  ConfirmDelete
} from '@/components/data'
import { DbTableHeader } from '@/components/shared'

const MODULES: Record<string, { title: string; type: string }> = {
  'user-memories': { title: 'User Memories', type: 'user_memory' },
  'user-profiles': { title: 'User Profiles', type: 'user_profile' },
  'entity-memories': { title: 'Entity Memories', type: 'entity_memory' },
  'session-context': { title: 'Session Context', type: 'session_summary' },
  'decision-logs': { title: 'Decision Logs', type: 'decision_log' }
}

function firstMemory(row: LearningRow) {
  return row.content?.memories?.[0]
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
      <div
        className={cnBox(mono)}
      >
        {value ?? '—'}
      </div>
    </div>
  )
}

function cnBox(mono?: boolean) {
  return `rounded-lg border border-border bg-inset px-3 py-2.5 text-[13px] text-muted ${mono ? 'font-mono text-[12px] break-all' : ''}`
}

export function Learning() {
  const { module = 'user-memories' } = useParams()
  const mod = MODULES[module] ?? MODULES['user-memories']
  const { config } = useOS()
  const [selected, setSelected] = useState<LearningRow | null>(null)

  const { rows, meta, loading, error, page, setPage, reload } =
    usePaginatedList<LearningRow>(
      (params, s) => api.learnings(params, s),
      { limit: 25, params: { learning_type: mod.type } }
    )

  const mem = selected ? firstMemory(selected) : undefined

  return (
    <div>
      <PageHeader title={mod.title}>
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: 'agno_learnings' },
            { label: 'Total', value: meta?.total_count ?? '—' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<LearningRow>
          columns={[
            {
              key: 'memory',
              header: 'Memory',
              render: (r) => (
                <span className="line-clamp-2 text-fg">
                  {firstMemory(r)?.content || '—'}
                </span>
              )
            },
            {
              key: 'component',
              header: 'Added by',
              render: (r) => <PrimitiveTag agentId={r.agent_id} teamId={r.team_id} />
            },
            { key: 'user_id', header: 'User', render: (r) => r.user_id || '—' },
            {
              key: 'updated_at',
              header: 'Updated',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.updated_at)}
                </span>
              )
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) => (
                <ConfirmDelete onConfirm={async () => { await api.deleteLearning(r.learning_id); reload() }} />
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty={`No ${mod.title.toLowerCase()} yet.`}
          getKey={(r) => r.learning_id}
          onRowClick={setSelected}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer
        open={!!selected}
        title={<span className="line-clamp-1">{mem?.content ?? mod.title}</span>}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <Field label="Content" value={mem?.content} />
            <Field label="Added by agent" value={mem?.added_by_agent ?? selected.agent_id} mono />
            {mem?.source && <Field label="Source" value={mem.source} />}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Created at" value={formatDateTime(selected.created_at)} mono />
              <Field label="Updated at" value={formatDateTime(selected.updated_at)} mono />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
