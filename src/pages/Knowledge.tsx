import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RotateCw } from 'lucide-react'
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
  StatusPill,
  ConfirmDelete
} from '@/components/data'
import { DbTableHeader } from '@/components/shared'

function AddContentForm({
  knowledgeId,
  onAdded
}: {
  knowledgeId: string
  onAdded: () => void
}) {
  const [source, setSource] = useState<'text' | 'url' | 'file'>('text')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    (source === 'text' && text.trim()) ||
    (source === 'url' && url.trim()) ||
    (source === 'file' && file)

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    const form = new FormData()
    if (name.trim()) form.set('name', name.trim())
    if (description.trim()) form.set('description', description.trim())
    if (source === 'text') form.set('text_content', text)
    if (source === 'url') form.set('url', url.trim())
    if (source === 'file' && file) form.set('file', file)
    try {
      await api.addKnowledgeContent(knowledgeId, form)
      onAdded()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-border p-0.5">
        {(['text', 'url', 'file'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={
              'flex-1 rounded px-2 py-1.5 font-mono text-[11px] uppercase ' +
              (source === s ? 'bg-hoverstrong text-fg' : 'text-faint')
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div>
        <div className="label mb-1.5">Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>
      <div>
        <div className="label mb-1.5">Description</div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>

      {source === 'text' && (
        <div>
          <div className="label mb-1.5">Text</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-md border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
        </div>
      )}
      {source === 'url' && (
        <div>
          <div className="label mb-1.5">URL</div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-border bg-panel px-3 py-2 font-mono text-[13px] text-fg outline-none focus:border-accent"
          />
        </div>
      )}
      {source === 'file' && (
        <div>
          <div className="label mb-1.5">File</div>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-[13px] text-muted file:mr-3 file:rounded file:border-0 file:bg-hoverstrong file:px-3 file:py-1.5 file:text-fg"
          />
        </div>
      )}

      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={submit}
        disabled={busy || !canSubmit}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Add content
      </button>
    </div>
  )
}

function RefreshButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation()
        setBusy(true)
        try {
          await api.refreshKnowledgeContent(id)
          onDone()
        } finally {
          setBusy(false)
        }
      }}
      className="text-faint hover:text-fg"
      title="Refresh (re-embed)"
    >
      <RotateCw className={busy ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
    </button>
  )
}

export function Knowledge() {
  const { config } = useOS()
  const instances = useMemo(
    () => config?.knowledge?.knowledge_instances ?? [],
    [config]
  )
  const [kid, setKid] = useState('')
  const [selected, setSelected] = useState<KnowledgeContent | null>(null)
  const [adding, setAdding] = useState(false)
  const active = instances.find((i) => i.id === kid)

  useEffect(() => {
    if (!kid && instances.length) setKid(instances[0].id)
  }, [instances, kid])

  const { rows, meta, loading, error, page, setPage, reload } =
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
            <div className="flex items-center gap-2">
              <select
                value={kid}
                onChange={(e) => setKid(e.target.value)}
                className="rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-muted outline-none hover:bg-hover"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAdding(true)}
                disabled={!kid}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add content
              </button>
            </div>
          )
        }
      >
        <DbTableHeader
          items={[
            { label: 'Database', value: config?.os_database },
            { label: 'Table', value: active?.table },
            { label: 'Documents', value: meta?.total_count ?? '—' }
          ]}
        />
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<KnowledgeContent>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => <span className="text-fg">{r.name || r.id}</span>
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
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (r) => (
                <div className="flex items-center justify-end gap-2.5">
                  <RefreshButton id={r.id} onDone={reload} />
                  <ConfirmDelete
                    onConfirm={async () => {
                      await api.deleteKnowledgeContent(r.id)
                      reload()
                    }}
                  />
                </div>
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

      <Drawer open={adding} title="Add content" onClose={() => setAdding(false)}>
        {kid && (
          <AddContentForm
            knowledgeId={kid}
            onAdded={() => {
              setAdding(false)
              reload()
            }}
          />
        )}
      </Drawer>

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
                <div className="text-[13px] text-fg">{selected.name || '—'}</div>
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
