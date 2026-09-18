import { useState } from 'react'
import { Loader2, Plus, Sparkles, Trash2, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import type { Memory as MemoryRow } from '@/lib/types'
import { PageHeader, DataTable, Pager, Drawer, PrimitiveTag } from '@/components/data'
import { DbTableHeader } from '@/components/shared'

function MemoryForm({
  existing,
  onSaved
}: {
  existing?: MemoryRow
  onSaved: () => void
}) {
  const [memory, setMemory] = useState(existing?.memory ?? '')
  const [userId, setUserId] = useState(existing?.user_id ?? '')
  const [topics, setTopics] = useState((existing?.topics ?? []).join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!memory.trim()) return
    setBusy(true)
    setError(null)
    const body = {
      memory: memory.trim(),
      user_id: userId.trim() || undefined,
      topics: topics.trim() ? topics.split(',').map((t) => t.trim()).filter(Boolean) : undefined
    }
    try {
      if (existing?.memory_id) await api.updateMemory(existing.memory_id, body)
      else await api.createMemory(body)
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="label mb-1.5">Memory</div>
        <textarea
          autoFocus
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      <div>
        <div className="label mb-1.5">User ID</div>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      <div>
        <div className="label mb-1.5">Topics (comma-separated)</div>
        <input
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={save}
        disabled={busy || !memory.trim()}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {existing ? 'Save changes' : 'Create memory'}
      </button>
    </div>
  )
}

function DeleteCell({ id, onDone }: { id?: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!id) return null
  if (confirm) {
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <span className="text-[11px] text-red-300">Delete?</span>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await api.deleteMemory(id)
              onDone()
            } finally {
              setBusy(false)
            }
          }}
          className="text-red-400 hover:text-red-300"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setConfirm(false)} className="text-faint hover:text-fg">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setConfirm(true)}
        className="text-faint hover:text-red-300"
        title="Delete memory"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function Topics({ topics }: { topics?: string[] }) {
  if (!topics?.length) return <span className="text-faint">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {topics.map((t) => (
        <span
          key={t}
          className="rounded border border-border bg-inset px-1.5 py-0.5 font-mono text-[10px] text-muted"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

export function Memory() {
  const { config } = useOS()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MemoryRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const { rows, meta, loading, error, page, setPage, reload } = usePaginatedList<MemoryRow>(
    (params, s) => api.memories(params, s),
    { limit: 25, params: { search_content: search } }
  )

  const key = (r: MemoryRow) => r.memory_id ?? JSON.stringify(r)
  const toggle = (k: string) =>
    setSel((p) => {
      const n = new Set(p)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  const toggleAll = (keys: string[]) =>
    setSel((p) => (keys.every((k) => p.has(k)) ? new Set() : new Set(keys)))

  const optimize = async () => {
    setOptimizing(true)
    try {
      await api.optimizeMemories()
      reload()
    } finally {
      setOptimizing(false)
    }
  }

  const deleteSelected = async () => {
    const ids = rows.filter((r) => r.memory_id && sel.has(key(r))).map((r) => r.memory_id!)
    if (ids.length === 0) return
    setDeleting(true)
    try {
      await api.deleteMemories(ids)
      setSel(new Set())
      reload()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Memory"
        actions={
          <div className="flex items-center gap-2">
            {sel.size > 0 && (
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-md border border-red-900/60 px-3 py-1.5 text-[12px] text-red-300 hover:bg-red-950/30 disabled:opacity-40"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete {sel.size}
              </button>
            )}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories…"
              className="w-56 rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-fg outline-none focus:border-accent"
            />
            <button
              onClick={optimize}
              disabled={optimizing}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
            >
              <Sparkles className={optimizing ? 'h-3.5 w-3.5 animate-pulse' : 'h-3.5 w-3.5'} />
              Optimize
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
        }
      >
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: 'agno_memories' },
            { label: 'Total', value: meta?.total_count ?? '—' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<MemoryRow>
          columns={[
            {
              key: 'memory',
              header: 'Memory',
              render: (r) => (
                <span className="text-fg">{r.memory || '—'}</span>
              )
            },
            {
              key: 'topics',
              header: 'Topics',
              render: (r) => <Topics topics={r.topics} />
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
              render: (r) => <DeleteCell id={r.memory_id} onDone={reload} />
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="No memories stored yet."
          getKey={(r) => r.memory_id ?? JSON.stringify(r)}
          onRowClick={setSelected}
          selection={{ selected: sel, onToggle: toggle, onToggleAll: toggleAll }}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer open={creating} title="New memory" onClose={() => setCreating(false)}>
        <MemoryForm
          onSaved={() => {
            setCreating(false)
            reload()
          }}
        />
      </Drawer>

      <Drawer
        open={!!selected}
        title="Memory"
        onClose={() => {
          setSelected(null)
          setEditing(false)
        }}
      >
        {selected && editing && (
          <MemoryForm
            existing={selected}
            onSaved={() => {
              setEditing(false)
              setSelected(null)
              reload()
            }}
          />
        )}
        {selected && !editing && (
          <div className="space-y-5">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
            >
              Edit
            </button>
            <div>
              <div className="label mb-1.5">Memory</div>
              <div className="rounded-lg border border-border bg-inset px-3 py-2.5 text-[14px] text-fg">
                {selected.memory || '—'}
              </div>
            </div>
            <div>
              <div className="label mb-1.5">Topics</div>
              <Topics topics={selected.topics} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label mb-1.5">Added by</div>
                <PrimitiveTag agentId={selected.agent_id} teamId={selected.team_id} />
              </div>
              <div>
                <div className="label mb-1.5">User</div>
                <div className="font-mono text-[12px] text-muted">
                  {selected.user_id || '—'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label mb-1.5">Created</div>
                <div className="font-mono text-[12px] text-muted">
                  {formatDateTime(selected.created_at)}
                </div>
              </div>
              <div>
                <div className="label mb-1.5">Updated</div>
                <div className="font-mono text-[12px] text-muted">
                  {formatDateTime(selected.updated_at)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
