import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { formatDateTime } from '@/lib/format'
import type { ServiceAccount } from '@/lib/types'
import { PageHeader, DataTable, Pager } from '@/components/data'

export function ServiceAccounts() {
  const { rows, meta, loading, error, page, setPage } =
    usePaginatedList<ServiceAccount>(
      (params, s) => api.serviceAccounts(params, s),
      { limit: 25 }
    )

  return (
    <div>
      <PageHeader title="Service Accounts">
        <span className="text-[12px] text-faint">
          Machine tokens that call this AgentOS. {meta?.total_count ?? 0} total.
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<ServiceAccount>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => <span className="text-white">{r.name || r.id}</span>
            },
            {
              key: 'token_preview',
              header: 'Token',
              render: (r) => (
                <span className="font-mono text-[12px] text-faint">
                  {r.token_preview || '••••••••'}
                </span>
              )
            },
            {
              key: 'last_used_at',
              header: 'Last used',
              render: (r) => formatDateTime(r.last_used_at)
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
          empty="No service accounts yet."
          getKey={(r) => r.id}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>
    </div>
  )
}
