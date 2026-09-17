import { useState } from 'react'
import { ChevronLeft, Loader2, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { formatDateTime } from '@/lib/format'
import type { Component, ComponentConfig } from '@/lib/types'
import { ComponentForm, type FormOptions } from '@/components/ComponentForm'
import { StudioCanvas } from '@/components/StudioCanvas'
import { Spinner } from '@/components/ui'

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-soft px-8 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-white">
          <ChevronLeft className="h-4 w-4" />
          {component.name || component.component_id}
          <span className="font-mono text-[10px] uppercase text-faint">
            {component.component_type}
          </span>
        </button>
        <button
          onClick={save}
          disabled={busy || !draft}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save as new version
        </button>
      </div>

      {loading && !data ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="h-5 w-5 text-faint" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_400px]">
          <div className="min-h-[300px] border-r border-border-soft">
            <StudioCanvas
              type={component.component_type}
              name={component.name || component.component_id}
              config={config}
              onChange={setDraft}
              agents={options.agents}
            />
          </div>
          <div className="overflow-y-auto p-6">
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
                          <span className="font-mono text-[12px] text-white">v{v.version}</span>
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
        </div>
      )}
    </div>
  )
}
