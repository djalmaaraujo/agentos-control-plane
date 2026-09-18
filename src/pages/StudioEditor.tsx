import { lazy, Suspense, useState } from 'react'
import { ChevronLeft, Loader2, Check, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { formatDateTime } from '@/lib/format'
import type { Component, ComponentConfig, ComponentType } from '@/lib/types'
import { ComponentForm, type FormOptions } from '@/components/ComponentForm'
import { Drawer, JsonBlock, ConfirmDelete } from '@/components/data'
import { CopyBlock } from '@/components/shared'
import { Spinner } from '@/components/ui'

// React Flow is heavy and only needed here — load it as its own chunk on demand.
const StudioCanvas = lazy(() =>
  import('@/components/StudioCanvas').then((m) => ({ default: m.StudioCanvas }))
)

const API_ROUTE: Record<ComponentType, { base: string; idParam: string; mcpTool: string }> = {
  agent: { base: 'agents', idParam: 'agent_id', mcpTool: 'run_agent' },
  team: { base: 'teams', idParam: 'team_id', mcpTool: 'run_team' },
  workflow: { base: 'workflows', idParam: 'workflow_id', mcpTool: 'run_workflow' }
}

function ApiAccessPanel({ type, id }: { type: ComponentType; id: string }) {
  const r = API_ROUTE[type]
  const curl = `curl -X POST "$AGENTOS_URL/${r.base}/${id}/runs" \\
  -H "Authorization: Bearer $OS_SECURITY_KEY" \\
  -F "message=Hello" \\
  -F "stream=false"`
  const mcp = `# MCP server: $AGENTOS_URL/mcp
# Call the built-in tool:
${r.mcpTool}(${r.idParam}="${id}", message="Hello")`
  return (
    <div className="mt-6">
      <div className="label mb-2">API access</div>
      <p className="mb-3 text-[12px] leading-relaxed text-faint">
        Published — reachable over REST and the OS MCP server. Set{' '}
        <span className="font-mono">$AGENTOS_URL</span> and{' '}
        <span className="font-mono">$OS_SECURITY_KEY</span> to your values.
      </p>
      <div className="space-y-3">
        <CopyBlock label="REST · run" value={curl} />
        <CopyBlock label={`MCP · ${r.mcpTool}`} value={mcp} />
      </div>
    </div>
  )
}

export function StudioEditor({
  component,
  options,
  onBack,
  onChanged
}: {
  component: Component
  options: FormOptions
  onBack: () => void
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
  const [viewing, setViewing] = useState<ComponentConfig | null>(null)

  const config = draft ?? data?.config ?? {}

  const viewVersion = async (version: number) => {
    setViewing(await api.componentConfig(component.component_id, version))
  }

  const deleteVersion = async (version: number) => {
    await api.deleteComponentConfig(component.component_id, version)
    versions.reload()
    reload()
  }

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

  const publish = async () => {
    if (!data?.version) return
    setBusy(true)
    try {
      await api.publishConfig(component.component_id, data.version)
      reload()
      versions.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-soft px-8 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-fg">
          <ChevronLeft className="h-4 w-4" />
          {component.name || component.component_id}
          <span className="font-mono text-[10px] uppercase text-faint">
            {component.component_type}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {data?.stage !== 'published' && (
            <button
              onClick={publish}
              disabled={busy || !!draft}
              title={draft ? 'Save first, then publish' : 'Publish current version'}
              className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:bg-hover hover:text-fg disabled:opacity-40"
            >
              Publish
            </button>
          )}
          {data?.stage === 'published' && (
            <span className="rounded border border-emerald-900/60 px-2 py-1 font-mono text-[10px] uppercase text-emerald-400">
              published
            </span>
          )}
          <button
            onClick={save}
            disabled={busy || !draft}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90 disabled:opacity-40"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save as new version
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-5 w-5 text-faint" />
        </div>
      ) : (
        <div
          className={
            component.component_type === 'agent'
              ? 'min-h-0 flex-1 overflow-y-auto'
              : 'grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]'
          }
        >
          {component.component_type !== 'agent' && (
            <div className="min-h-[300px] border-r border-border-soft">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <Spinner className="h-5 w-5 text-faint" />
                  </div>
                }
              >
                <StudioCanvas
                  type={component.component_type}
                  name={component.name || component.component_id}
                  config={config}
                  onChange={setDraft}
                  agents={options.agents}
                  teams={options.teams}
                  functions={options.functions}
                />
              </Suspense>
            </div>
          )}
          <div
            className={
              component.component_type === 'agent'
                ? 'mx-auto max-w-2xl p-6'
                : 'overflow-y-auto p-6'
            }
          >
            <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-faint">
              v{data?.version ?? component.current_version ?? '—'}
              {data?.stage && <span> · {data.stage}</span>}
            </div>
            <ComponentForm
              type={component.component_type}
              config={config}
              onChange={setDraft}
              options={options}
            />
            {data?.stage === 'published' && (
              <ApiAccessPanel type={component.component_type} id={component.component_id} />
            )}
            <div className="mt-6">
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
                          <span className="font-mono text-[12px] text-fg">v{v.version}</span>
                          <span className="font-mono text-[10px] text-faint">
                            {formatDateTime(v.created_at)}
                          </span>
                          {v.stage && (
                            <span className="font-mono text-[10px] uppercase text-faint">
                              {v.stage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => viewVersion(v.version)}
                            className="text-faint hover:text-fg"
                            title="View config"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-emerald-400">
                              <Check className="h-3 w-3" /> current
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => setCurrent(v.version)}
                                className="font-mono text-[10px] uppercase tracking-wider text-faint hover:text-fg"
                              >
                                Set current
                              </button>
                              <ConfirmDelete onConfirm={() => deleteVersion(v.version)} />
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Drawer
        open={!!viewing}
        title={
          <span className="font-mono text-[13px]">
            v{viewing?.version}
            {viewing?.stage && <span className="text-faint"> · {viewing.stage}</span>}
          </span>
        }
        onClose={() => setViewing(null)}
      >
        {viewing && <JsonBlock value={viewing.config ?? {}} />}
      </Drawer>
    </div>
  )
}
