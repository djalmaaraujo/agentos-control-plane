import { useState } from 'react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import type { RegistryItem } from '@/lib/types'
import { PageHeader, DataTable, Pager } from '@/components/data'

export function Registry() {
  const [q, setQ] = useState('')
  const { rows, meta, loading, error, page, setPage } =
    usePaginatedList<RegistryItem>((params, s) => api.registry(params, s), {
      limit: 50
    })

  const filtered = q
    ? rows.filter((r) => (r.name + (r.type ?? '')).toLowerCase().includes(q.toLowerCase()))
    : rows

  return (
    <div>
      <PageHeader
        title="Registry"
        actions={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter…"
            className="w-56 rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-white outline-none focus:border-accent"
          />
        }
      >
        <span className="text-[12px] text-faint">
          Tools, toolkits and resources this OS can build with.{' '}
          {meta?.total_count ?? 0} total.
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<RegistryItem>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => <span className="font-mono text-[13px] text-white">{r.name}</span>
            },
            {
              key: 'type',
              header: 'Type',
              render: (r) => (
                <span className="rounded border border-border bg-black/30 px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
                  {r.type || '—'}
                </span>
              )
            },
            {
              key: 'class_path',
              header: 'Class path',
              render: (r) => (
                <span className="font-mono text-[11px] text-faint">
                  {r.metadata?.class_path || '—'}
                </span>
              )
            }
          ]}
          rows={filtered}
          loading={loading}
          error={error}
          empty="Registry is empty."
          getKey={(r) => r.id}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>
    </div>
  )
}
