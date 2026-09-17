import { useMemo, useState } from 'react'
import { Bot, Check, Loader2, Plus, Users, Workflow } from 'lucide-react'
import { api } from '@/lib/api'
import { usePaginatedList } from '@/lib/usePaginatedList'
import { useApi } from '@/lib/useApi'
import { useOS } from '@/lib/osContext'
import { formatDateTime } from '@/lib/format'
import type {
  Component,
  ComponentConfig,
  ComponentType,
  RegistryItem
} from '@/lib/types'
import {
  PageHeader,
  DataTable,
  Pager,
  Drawer,
  ConfirmDelete
} from '@/components/data'
import { ComponentForm, type FormOptions } from '@/components/ComponentForm'
import { Spinner } from '@/components/ui'

const TYPE_ICON = { agent: Bot, team: Users, workflow: Workflow }

function TypeBadge({ type }: { type: ComponentType }) {
  const Icon = TYPE_ICON[type]
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-muted">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      {type}
    </span>
  )
}

function useFormOptions(): FormOptions {
  const { config } = useOS()
  const reg = useApi(
    (s) => api.registry({ limit: 200 }, s),
    []
  )
  return useMemo(
    () => ({
      models: config?.available_models ?? [],
      tools: (reg.data?.data ?? [])
        .filter((r: RegistryItem) => r.type === 'tool' || r.type === 'function')
        .map((r: RegistryItem) => r.name),
      agents: (config?.agents ?? []).map((a) => ({ id: a.id, name: a.name }))
    }),
    [config, reg.data]
  )
}

function CreateForm({
  options,
  onCreated
}: {
  options: FormOptions
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ComponentType>('agent')
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
      <div>
        <div className="label mb-1.5">Type</div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as ComponentType)
            setConfig({})
          }}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-muted outline-none"
        >
          <option value="agent">Agent</option>
          <option value="team">Team</option>
          <option value="workflow">Workflow</option>
        </select>
      </div>

      <ComponentForm type={type} config={config} onChange={setConfig} options={options} />

      {error && <p className="text-[12px] text-red-300">{error}</p>}
      <button
        onClick={create}
        disabled={busy || !name.trim()}
        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Create component
      </button>
    </div>
  )
}

function EditForm({
  component,
  options,
  onChanged
}: {
  component: Component
  options: FormOptions
  onChanged: () => void
}) {
  const { data, loading, reload } = useApi<ComponentConfig>(
    (s) => api.componentCurrentConfig(component.component_id, s),
    [component.component_id]
  )
  const versions = useApi<ComponentConfig[]>(
    (s) => api.componentConfigs(component.component_id, s),
    [component.component_id]
  )
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [busy, setBusy] = useState(false)

  const config = draft ?? data?.config ?? {}

  const save = async () => {
    setBusy(true)
    try {
      await api.saveComponentConfig(component.component_id, config)
      setDraft(null)
      reload()
      versions.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const setCurrent = async (version: number) => {
    await api.setCurrentConfig(component.component_id, version)
    setDraft(null)
    reload()
    versions.reload()
    onChanged()
  }

  if (loading && !data) return <Spinner className="h-4 w-4 text-faint" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[12px] text-muted">
          v{data?.version ?? component.current_version ?? '—'}{' '}
          {data?.stage && <span className="text-faint">· {data.stage}</span>}
        </div>
        <button
          onClick={save}
          disabled={busy || !draft}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save as new version
        </button>
      </div>

      <ComponentForm
        type={component.component_type}
        config={config}
        onChange={setDraft}
        options={options}
      />

      <div>
        <div className="label mb-2">Versions</div>
        {versions.loading && <Spinner className="h-4 w-4 text-faint" />}
        <div className="space-y-1.5">
          {(versions.data ?? [])
            .slice()
            .sort((a, b) => b.version - a.version)
            .map((v) => {
              const isCurrent = v.version === data?.version
              return (
                <div
                  key={v.version}
                  className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-white">v{v.version}</span>
                    <span className="font-mono text-[10px] uppercase text-faint">{v.stage}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {formatDateTime(v.created_at)}
                    </span>
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-emerald-400">
                      <Check className="h-3 w-3" /> current
                    </span>
                  ) : (
                    <button
                      onClick={() => setCurrent(v.version)}
                      className="font-mono text-[10px] uppercase tracking-wider text-faint hover:text-white"
                    >
                      Set current
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

export function Studio() {
  const options = useFormOptions()
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Component | null>(null)
  const { rows, meta, loading, error, page, setPage, reload } =
    usePaginatedList<Component>((params, s) => api.components(params, s), { limit: 25 })

  return (
    <div>
      <PageHeader
        title="Studio"
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New component
          </button>
        }
      >
        <span className="text-[12px] text-faint">
          Build and version agents, teams and workflows at runtime.{' '}
          {meta?.total_count ?? 0} components.
        </span>
      </PageHeader>

      <div className="px-8 py-2">
        <DataTable<Component>
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (r) => <span className="text-white">{r.name || r.component_id}</span>
            },
            {
              key: 'type',
              header: 'Type',
              render: (r) => <TypeBadge type={r.component_type} />
            },
            {
              key: 'version',
              header: 'Version',
              render: (r) => (
                <span className="font-mono text-[12px] text-muted">
                  v{r.current_version ?? 1}
                </span>
              )
            },
            {
              key: 'created_at',
              header: 'Created',
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
                    await api.deleteComponent(r.component_id)
                    reload()
                  }}
                />
              )
            }
          ]}
          rows={rows}
          loading={loading}
          error={error}
          empty="No components built yet. Create one to get started."
          getKey={(r) => r.component_id}
          onRowClick={setSelected}
        />
        <Pager page={page} totalPages={meta?.total_pages ?? 1} onPage={setPage} />
      </div>

      <Drawer open={creating} title="New component" onClose={() => setCreating(false)}>
        <CreateForm
          options={options}
          onCreated={() => {
            setCreating(false)
            reload()
          }}
        />
      </Drawer>

      <Drawer
        open={!!selected}
        title={
          selected && (
            <span className="flex items-center gap-2">
              {selected.name || selected.component_id}
              <span className="font-mono text-[10px] uppercase text-faint">
                {selected.component_type}
              </span>
            </span>
          )
        }
        onClose={() => setSelected(null)}
      >
        {selected && (
          <EditForm component={selected} options={options} onChanged={reload} />
        )}
      </Drawer>
    </div>
  )
}
