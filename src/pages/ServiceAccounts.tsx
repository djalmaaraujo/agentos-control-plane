import { useMemo, useState } from 'react'
import { Check, Copy, KeyRound, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useApi } from '@/lib/useApi'
import { formatDateTime } from '@/lib/format'
import type { ComponentRef, ServiceAccount } from '@/lib/types'
import {
  ADMIN_SCOPE,
  DEFAULT_SCOPES,
  GLOBAL_SCOPE_GROUPS,
  RUN_RESOURCES,
  isPrivilegedScope
} from '@/lib/scopes'
import { PageHeader, DataTable, Pager, Drawer, ConfirmDelete } from '@/components/data'
import { PageEmpty } from '@/components/shared'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

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
        className="flex w-full items-center gap-2 rounded-md border border-border bg-inset px-3 py-2.5 text-left"
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

function ScopeChip({
  scope,
  checked,
  onToggle
}: {
  scope: string
  checked: boolean
  onToggle: () => void
}) {
  const priv = isPrivilegedScope(scope)
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'rounded border px-2 py-1 font-mono text-[11px] transition-colors',
        checked
          ? priv
            ? 'border-amber-700/60 bg-amber-950/30 text-amber-300'
            : 'border-accent/60 bg-accent-dim text-accent'
          : 'border-border text-faint hover:border-border hover:text-muted'
      )}
    >
      {scope}
    </button>
  )
}

function RunList({
  resource,
  items,
  selected,
  toggle
}: {
  resource: string
  items: ComponentRef[]
  selected: Set<string>
  toggle: (scope: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c) => {
        const scope = `${resource}:${c.id}:run`
        return (
          <ScopeChip
            key={c.id}
            scope={scope}
            checked={selected.has(scope)}
            onToggle={() => toggle(scope)}
          />
        )
      })}
    </div>
  )
}

function CreateForm({ onCreated }: { onCreated: (token?: string) => void }) {
  const [name, setName] = useState('')
  const [neverExpires, setNeverExpires] = useState(true)
  const [days, setDays] = useState(90)
  const [mode, setMode] = useState<'default' | 'custom'>('default')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agents = useApi<ComponentRef[]>((s) => api.agents(s), [])
  const teams = useApi<ComponentRef[]>((s) => api.teams(s), [])
  const workflows = useApi<ComponentRef[]>((s) => api.workflows(s), [])
  const runData: Record<string, ComponentRef[]> = {
    agents: agents.data ?? [],
    teams: teams.data ?? [],
    workflows: workflows.data ?? []
  }

  const toggle = (scope: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })

  const scopeList = useMemo(() => [...selected].sort(), [selected])
  const privileged = scopeList.filter(isPrivilegedScope)
  const adminOn = selected.has(ADMIN_SCOPE)

  const create = async () => {
    if (!name.trim()) return
    if (mode === 'custom' && scopeList.length === 0) {
      setError('Pick at least one scope, or use the default preset.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await api.createServiceAccount({
        name: name.trim(),
        scopes:
          mode === 'custom'
            ? scopeList.map((scope) => ({ scope, effect: 'allow' as const }))
            : undefined,
        never_expires: neverExpires,
        expires_in_days: neverExpires ? undefined : days,
        allow_privileged_scopes: mode === 'custom' && privileged.length > 0 ? true : undefined
      })
      onCreated(res.token)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="label mb-1.5">Name</div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. ci-deploy"
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <p className="mt-1 text-[11px] text-faint">
          Lowercase slug: letters, digits and dashes.
        </p>
      </div>

      <div>
        <div className="label mb-1.5">Scopes</div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {(['default', 'custom'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 rounded px-3 py-1 text-[12px] transition-colors',
                mode === m ? 'bg-accent text-black' : 'text-faint hover:text-fg'
              )}
            >
              {m === 'default' ? 'Default (run + read)' : 'Custom'}
            </button>
          ))}
        </div>
        {mode === 'default' && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEFAULT_SCOPES.map((s) => (
              <span
                key={s}
                className="rounded border border-border bg-inset px-2 py-1 font-mono text-[11px] text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {mode === 'custom' && (
        <div className="space-y-5 border-t border-border-soft pt-4">
          <label className="flex items-center gap-2 rounded-md border border-border p-2.5 text-[13px]">
            <input
              type="checkbox"
              checked={adminOn}
              onChange={() => toggle(ADMIN_SCOPE)}
            />
            <span className="font-mono text-[12px] text-amber-300">{ADMIN_SCOPE}</span>
            <span className="text-faint">— full access (overrides everything)</span>
          </label>

          {!adminOn && (
            <>
              <div>
                <div className="label mb-2">Run access</div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {RUN_RESOURCES.map((r) => {
                    const scope = `${r.resource}:run`
                    return (
                      <ScopeChip
                        key={scope}
                        scope={`any ${r.label.toLowerCase()} · ${scope}`}
                        checked={selected.has(scope)}
                        onToggle={() => toggle(scope)}
                      />
                    )
                  })}
                </div>
                {RUN_RESOURCES.map((r) => (
                  <div key={r.kind} className="mb-2">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-faint">
                      {r.label}
                    </div>
                    <RunList
                      resource={r.resource}
                      items={runData[r.resource]}
                      selected={selected}
                      toggle={toggle}
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="label mb-2">Data & admin access</div>
                <div className="space-y-2">
                  {GLOBAL_SCOPE_GROUPS.map((grp) => (
                    <div key={grp.resource} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 text-[12px] text-muted">{grp.label}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.scopes.map((sc) => (
                          <ScopeChip
                            key={sc.scope}
                            scope={sc.action + (sc.privileged ? ' ⚠' : '')}
                            checked={selected.has(sc.scope)}
                            onToggle={() => toggle(sc.scope)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {privileged.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-700/50 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Privileged scopes selected ({privileged.length}). The token is minted
                with <span className="font-mono">allow_privileged_scopes</span>.
              </span>
            </div>
          )}

          <div>
            <div className="label mb-1.5">
              Selected <span className="text-faint">{scopeList.length}</span>
            </div>
            {scopeList.length === 0 ? (
              <p className="text-[12px] text-faint">Nothing selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {scopeList.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      'rounded border px-2 py-1 font-mono text-[11px]',
                      isPrivilegedScope(s)
                        ? 'border-amber-700/60 text-amber-300'
                        : 'border-border text-muted'
                    )}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-border-soft pt-4">
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
              className="w-32 rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

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
      { limit: 25, params: { include_revoked: false } }
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
                  render: (r) => <span className="text-fg">{r.name || r.id}</span>
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
                  key: 'scopes',
                  header: 'Scopes',
                  render: (r) => {
                    const scopes = r.scopes ?? []
                    if (scopes.length === 0)
                      return <span className="text-faint">default</span>
                    const first = scopes[0]?.raw
                    return (
                      <span className="font-mono text-[11px] text-muted">
                        {first}
                        {scopes.length > 1 && (
                          <span className="text-faint"> +{scopes.length - 1}</span>
                        )}
                      </span>
                    )
                  }
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
