import { useState } from 'react'
import { Check, Copy, KeyRound, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { formatDateTime } from '@/lib/format'
import type { ServiceAccount } from '@/lib/types'
import { PageHeader, DataTable, Pager, Drawer, ConfirmDelete } from '@/components/data'
import { PageEmpty } from '@/components/shared'
import { Spinner } from '@/components/ui'

function CreatedToken({ token, onClose }: { token: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-amber-300">
        Copy this token now — it won't be shown again.
      </p>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(token)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-black/40 px-3 py-2.5 text-left"
      >
        <span className="flex-1 break-all font-mono text-[12px] text-muted">{token}</span>
        {copied ? (
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : (
          <Copy className="h-4 w-4 shrink-0 text-faint" />
        )}
      </button>
      <button
        onClick={onClose}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
      >
        Done
      </button>
    </div>
  )
}

function CreateForm({ onCreated }: { onCreated: (token?: string) => void }) {
  const [name, setName] = useState('')
  const [neverExpires, setNeverExpires] = useState(true)
  const [days, setDays] = useState(90)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.createServiceAccount({
        name: name.trim(),
        never_expires: neverExpires,
        expires_in_days: neverExpires ? undefined : days
      })
      onCreated(res.token)
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
          placeholder="e.g. ci-deploy"
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        <input
          type="checkbox"
          checked={neverExpires}
          onChange={(e) => setNeverExpires(e.target.checked)}
        />
        Never expires
      </label>
      {!neverExpires && (
        <div>
          <div className="label mb-1.5">Expires in (days)</div>
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-32 rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </div>
      )}
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={create}
        disabled={busy || !name.trim()}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </button>
    </div>
  )
}

export function ServiceAccounts() {
  const [creating, setCreating] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const { rows, meta, loading, error, page, setPage, reload } =
    usePaginatedList<ServiceAccount>(
      (params, s) => api.serviceAccounts(params, s),
      { limit: 25 }
    )

  const empty = !loading && !error && rows.length === 0

  return (
    <div>
      <PageHeader
        title="Service Accounts"
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add account
          </button>
        }
      >
        <span className="text-[12px] text-faint">
          Machine tokens that call this AgentOS. {meta?.total_count ?? 0} total.
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-5 w-5 text-faint" />
          </div>
        ) : empty ? (
          <PageEmpty
            icon={
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-black">
                <KeyRound className="h-6 w-6" />
              </span>
            }
            title="No service accounts yet"
            subtitle="Create service accounts with access tokens for services to call this OS."
            action={
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add account
              </button>
            }
          />
        ) : (
          <>
            <DataTable<ServiceAccount>
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (r) => <span className="text-white">{r.name || r.id}</span>
                },
                {
                  key: 'token',
                  header: 'Token',
                  render: (r) => (
                    <span className="font-mono text-[12px] text-faint">
                      {r.token_prefix || r.token_preview || '••••••••'}…
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
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (r) => (
                    <ConfirmDelete
                      onConfirm={async () => {
                        await api.deleteServiceAccount(r.id)
                        reload()
                      }}
                    />
                  )
                }
              ]}
              rows={rows}
              loading={loading}
              error={error}
              getKey={(r) => r.id}
            />
            <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
          </>
        )}
      </div>

      <Drawer
        open={creating || !!newToken}
        title={newToken ? 'Account created' : 'Add service account'}
        onClose={() => {
          setCreating(false)
          setNewToken(null)
        }}
      >
        {newToken ? (
          <CreatedToken
            token={newToken}
            onClose={() => {
              setNewToken(null)
              reload()
            }}
          />
        ) : (
          <CreateForm
            onCreated={(token) => {
              setCreating(false)
              if (token) setNewToken(token)
              reload()
            }}
          />
        )}
      </Drawer>
    </div>
  )
}
