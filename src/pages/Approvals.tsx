import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { formatDateTime } from '@/lib/format'
import type { Approval } from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  Drawer,
  JsonBlock,
  PrimitiveTag,
  StatusPill
} from '@/components/data'

export function Approvals() {
  const [selected, setSelected] = useState<Approval | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const { rows, meta, loading, error, page, setPage, reload } =
    usePaginatedList<Approval>((params, s) => api.approvals(params, s), {
      limit: 25
    })

  const resolve = async (id: string, approved: boolean) => {
    setBusy(id)
    try {
      await api.resolveApproval(id, approved)
      reload()
    } finally {
      setBusy(null)
    }
  }

  const pending = (a: Approval) =>
    !a.status || a.status.toLowerCase().includes('pend')

  return (
    <div>
      <PageHeader title="Approvals">
        <span className="text-[12px] text-faint">
          Tool calls waiting for a human. {meta?.total_count ?? 0} total.
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<Approval>
          columns={[
            {
              key: 'tool_name',
              header: 'Tool',
              render: (r) => (
                <span className="font-mono text-[13px] text-white">
                  {r.tool_name || r.id}
                </span>
              )
            },
            {
              key: 'component',
              header: 'Component',
              render: (r) => (
                <PrimitiveTag agentId={r.agent_id} teamId={r.team_id} />
              )
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusPill status={r.status} />
            },
            {
              key: 'created_at',
              header: 'Requested',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {formatDateTime(r.created_at)}
                </span>
              )
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) =>
                pending(r) ? (
                  <div
                    className="flex justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      disabled={busy === r.id}
                      title="Approve"
                      onClick={() => resolve(r.id, true)}
                      className="rounded border border-emerald-900/60 p-1.5 text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={busy === r.id}
                      title="Reject"
                      onClick={() => resolve(r.id, false)}
                      className="rounded border border-red-900/60 p-1.5 text-red-400 hover:bg-red-950/30 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="Nothing waiting for approval."
          getKey={(r) => r.id}
          onRowClick={setSelected}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer open={!!selected} title="Approval" onClose={() => setSelected(null)}>
        {selected && <JsonBlock value={selected} />}
      </Drawer>
    </div>
  )
}
