import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import type { KnowledgeContent } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  Drawer,
  JsonBlock,
  StatusPill
} from '@/components/data'

export function Knowledge() {
  const { config } = useOS()
  const instances = useMemo(
    () => config?.knowledge?.knowledge_instances ?? [],
    [config]
  )
  const [kid, setKid] = useState('')
  const [selected, setSelected] = useState<KnowledgeContent | null>(null)
  const active = instances.find((i) => i.id === kid)

  useEffect(() => {
    if (!kid && instances.length) setKid(instances[0].id)
  }, [instances, kid])

  const { rows, meta, loading, error, page, setPage } =
    usePaginatedList<KnowledgeContent>(
      (params, s) => api.knowledgeContent(params, s),
      { limit: 25, params: { knowledge_id: kid }, enabled: !!kid }
    )

  return (
    <div>
      <PageHeader
        title="Knowledge"
        actions={
          instances.length > 0 && (
            <select
              value={kid}
              onChange={(e) => setKid(e.target.value)}
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-white/5"
            >
              {instances.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          )
        }
      >
        <div className="flex items-center gap-8 text-[12px]">
          <div>
            <div className="label">Database</div>
            <div className="font-mono text-muted">{config?.os_database ?? '—'}</div>
          </div>
          <div>
            <div className="label">Table</div>
            <div className="font-mono text-muted">{active?.table ?? '—'}</div>
          </div>
          <div>
            <div className="label">Documents</div>
            <div className="font-mono text-muted">{meta?.total_count ?? '—'}</div>
          </div>
        </div>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<KnowledgeContent>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => <span className="text-white">{r.name || r.id}</span>
            },
            {
              key: 'type',
              header: 'Type',
              render: (r) => (
                <span className="font-mono text-[11px] uppercase text-muted">
                  {r.type || '—'}
                </span>
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusPill status={r.status} />
            },
            {
              key: 'updated_at',
              header: 'Updated',
              align: 'right',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.updated_at || r.created_at)}
                </span>
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty={
            kid ? 'This knowledge base is empty.' : 'No knowledge base configured.'
          }
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
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label mb-1">Name</div>
                <div className="text-[13px] text-white">{selected.name || '—'}</div>
              </div>
              <div>
                <div className="label mb-1">Type</div>
                <div className="font-mono text-[12px] uppercase text-muted">
                  {selected.type || '—'}
                </div>
              </div>
              <div>
                <div className="label mb-1">Status</div>
                <StatusPill status={selected.status} />
              </div>
              <div>
                <div className="label mb-1">Size</div>
                <div className="font-mono text-[12px] text-muted">
                  {selected.size ?? '—'}
                </div>
              </div>
            </div>
            {selected.description && (
              <div>
                <div className="label mb-1">Description</div>
                <div className="text-[13px] text-muted">{selected.description}</div>
              </div>
            )}
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div>
                <div className="label mb-2">Metadata</div>
                <JsonBlock value={selected.metadata} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
