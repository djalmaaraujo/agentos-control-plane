import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bot, Loader2, MoreVertical, Plus, Trash2, Users, Workflow } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useFormOptions } from '@/lib/useFormOptions'
import type { Component, ComponentType } from '@/lib/types'
import { PageHeader } from '@/components/data'
import { PageEmpty, CardGrid } from '@/components/shared'
import { Card, PillButton, Spinner } from '@/components/ui'
import { ComponentForm, type FormOptions } from '@/components/ComponentForm'
import { Drawer } from '@/components/data'
import { StudioEditor } from './StudioEditor'
import { cn } from '@/lib/utils'

const SLUG: Record<string, { type: ComponentType; label: string }> = {
  agents: { type: 'agent', label: 'Agent' },
  teams: { type: 'team', label: 'Team' },
  workflows: { type: 'workflow', label: 'Workflow' }
}

const ICON = { agent: Bot, team: Users, workflow: Workflow }

function CreateForm({
  type,
  options,
  onCreated
}: {
  type: ComponentType
  options: FormOptions
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = async () => {
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.createComponent({
        name: name.trim(),
        component_type: type,
        description:
          typeof config.description === 'string' ? config.description : undefined,
        config,
        set_current: true
      })
      onCreated()
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
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </div>
      <ComponentForm type={type} config={config} onChange={setConfig} options={options} />
      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={create}
        disabled={busy || !name.trim()}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Create
      </button>
    </div>
  )
}

function StudioCard({
  component,
  onChat,
  onEdit,
  onDeleted
}: {
  component: Component
  onChat: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const Icon = ICON[component.component_type]
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <Card className="flex min-h-[150px] flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-black">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="font-medium text-white">
            {component.name || component.component_id}
          </span>
        </div>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenu((m) => !m)}
            className="rounded p-1 text-faint hover:bg-white/5 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menu && (
            <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border border-border bg-panel p-1 shadow-xl">
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await api.deleteComponent(component.component_id)
                    onDeleted()
                  } finally {
                    setBusy(false)
                    setMenu(false)
                  }
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-red-300 hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {component.description && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {component.description}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="mb-3 font-mono text-[11px] text-faint">
          {component.current_version
            ? `Current version v${component.current_version}`
            : 'Draft — not published yet'}
        </div>
        <div className="flex gap-2">
          <PillButton onClick={onChat}>Chat</PillButton>
          <PillButton onClick={onEdit}>Edit</PillButton>
        </div>
      </div>
    </Card>
  )
}

export function StudioList() {
  const { type: slug = 'agents' } = useParams()
  const meta = SLUG[slug] ?? SLUG.agents
  const navigate = useNavigate()
  const options = useFormOptions()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Component | null>(null)

  const { rows, loading, error, reload } = usePaginatedList<Component>(
    (params, s) => api.components(params, s),
    { limit: 100 }
  )
  const items = rows.filter((r) => r.component_type === meta.type)

  if (editing) {
    return (
      <StudioEditor
        component={editing}
        options={options}
        onBack={() => setEditing(null)}
        onChanged={reload}
      />
    )
  }

  const EmptyIcon = ICON[meta.type]

  return (
    <div>
      <PageHeader
        title={`Studio · ${meta.label}s`}
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New {meta.label.toLowerCase()}
          </button>
        }
      />

      <div className="px-8 py-6">
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-5 w-5 text-faint" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : items.length === 0 ? (
          <PageEmpty
            icon={
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-black')}>
                <EmptyIcon className="h-6 w-6" />
              </span>
            }
            title="AgentOS Studio"
            subtitle={`Get started by creating a new ${meta.label.toLowerCase()}.`}
            action={
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New {meta.label.toLowerCase()}
              </button>
            }
          />
        ) : (
          <CardGrid>
            {items.map((c) => (
              <StudioCard
                key={c.component_id}
                component={c}
                onChat={() => navigate(`/chat?type=${c.component_type}&id=${c.component_id}`)}
                onEdit={() => setEditing(c)}
                onDeleted={reload}
              />
            ))}
          </CardGrid>
        )}
      </div>

      <Drawer
        open={creating}
        title={`New ${meta.label.toLowerCase()}`}
        onClose={() => setCreating(false)}
      >
        <CreateForm
          type={meta.type}
          options={options}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      </Drawer>
    </div>
  )
}
