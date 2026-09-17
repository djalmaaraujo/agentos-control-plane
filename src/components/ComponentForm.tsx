import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { ComponentType } from '@/lib/types'
import { JsonEditor } from './JsonEditor'
import { cn } from '@/lib/utils'

type Config = Record<string, unknown>

export interface FormOptions {
  models: { id?: string; provider?: string }[]
  tools: string[]
  agents: { id: string; name?: string }[]
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="label mb-1.5">{children}</div>
}

function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-[#2a2a2e]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      {children}
    </div>
  )
}

function MultiChips({
  options,
  selected,
  onToggle,
  labelOf
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  labelOf?: (v: string) => string
}) {
  const [q, setQ] = useState('')
  const shown = q
    ? options.filter((o) => (labelOf?.(o) ?? o).toLowerCase().includes(q.toLowerCase()))
    : options
  return (
    <div className="rounded-lg border border-border bg-black/20 p-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter…"
        className="mb-2 w-full bg-transparent px-1 text-[12px] text-white outline-none placeholder:text-faint"
      />
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {shown.length === 0 && <span className="px-1 text-[12px] text-faint">None</span>}
        {shown.map((o) => {
          const on = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={cn(
                'rounded border px-2 py-1 font-mono text-[11px]',
                on
                  ? 'border-accent bg-accent-dim text-accent'
                  : 'border-border bg-black/30 text-muted hover:text-white'
              )}
            >
              {labelOf?.(o) ?? o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ComponentForm({
  type,
  config,
  onChange,
  options
}: {
  type: ComponentType
  config: Config
  onChange: (c: Config) => void
  options: FormOptions
}) {
  const [advanced, setAdvanced] = useState(false)

  const set = (key: string, value: unknown) => {
    const next = { ...config }
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete next[key]
    } else {
      next[key] = value
    }
    onChange(next)
  }

  const modelId = ((config.model as { id?: string } | undefined)?.id) ?? ''
  const str = (k: string) => (typeof config[k] === 'string' ? (config[k] as string) : '')
  const bool = (k: string, dflt = false) =>
    typeof config[k] === 'boolean' ? (config[k] as boolean) : dflt
  const arr = (k: string): string[] =>
    Array.isArray(config[k]) ? (config[k] as string[]) : []

  const toggleIn = (k: string, v: string) => {
    const cur = arr(k)
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
  }

  if (type === 'workflow') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Description</Label>
          <input
            value={str('description')}
            onChange={(e) => set('description', e.target.value)}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </div>
        <div>
          <Label>Config (JSON)</Label>
          <p className="mb-2 text-[11px] text-faint">
            Workflows are defined by their steps — edit the config directly.
          </p>
          <JsonEditor
            value={JSON.stringify(config, null, 2)}
            onChange={(v) => {
              try {
                onChange(JSON.parse(v))
              } catch {
                /* keep typing */
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Model</Label>
        <select
          value={modelId}
          onChange={(e) => set('model', e.target.value ? { id: e.target.value } : undefined)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-muted outline-none"
        >
          <option value="">Default</option>
          {options.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} {m.provider ? `· ${m.provider}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Instructions</Label>
        <textarea
          value={str('instructions')}
          onChange={(e) => set('instructions', e.target.value)}
          rows={5}
          className="w-full resize-y rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </div>

      <div>
        <Label>Description</Label>
        <input
          value={str('description')}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </div>

      {type === 'agent' && (
        <>
          <div>
            <Label>Role</Label>
            <input
              value={str('role')}
              onChange={(e) => set('role', e.target.value)}
              className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div>
            <Label>Tools</Label>
            <MultiChips
              options={options.tools}
              selected={arr('tools')}
              onToggle={(v) => toggleIn('tools', v)}
            />
          </div>
        </>
      )}

      {type === 'team' && (
        <>
          <div>
            <Label>Mode</Label>
            <select
              value={str('mode') || 'coordinate'}
              onChange={(e) => set('mode', e.target.value)}
              className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-muted outline-none"
            >
              <option value="coordinate">Coordinate</option>
              <option value="route">Route</option>
              <option value="collaborate">Collaborate</option>
            </select>
          </div>
          <div>
            <Label>Members</Label>
            <MultiChips
              options={options.agents.map((a) => a.id)}
              selected={arr('members')}
              onToggle={(v) => toggleIn('members', v)}
              labelOf={(id) => options.agents.find((a) => a.id === id)?.name ?? id}
            />
          </div>
        </>
      )}

      <div className="space-y-3 rounded-lg border border-border-soft p-3">
        <Row label="Markdown">
          <Toggle checked={bool('markdown')} onChange={(v) => set('markdown', v)} />
        </Row>
        <Row label="Add history to context">
          <Toggle
            checked={bool('add_history_to_context', true)}
            onChange={(v) => set('add_history_to_context', v)}
          />
        </Row>
        <Row label="Add datetime to context">
          <Toggle
            checked={bool('add_datetime_to_context', true)}
            onChange={(v) => set('add_datetime_to_context', v)}
          />
        </Row>
        <Row label="History runs">
          <input
            type="number"
            min={0}
            value={
              typeof config.num_history_runs === 'number'
                ? (config.num_history_runs as number)
                : ''
            }
            onChange={(e) =>
              set('num_history_runs', e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-20 rounded-md border border-border bg-panel px-2 py-1 text-right text-sm text-white outline-none focus:border-accent"
          />
        </Row>
      </div>

      <div className="rounded-lg border border-border-soft">
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 text-faint transition-transform', advanced && 'rotate-90')} />
          <span className="label">Advanced — raw config JSON</span>
        </button>
        {advanced && (
          <div className="p-3 pt-0">
            <JsonEditor
              value={JSON.stringify(config, null, 2)}
              rows={12}
              onChange={(v) => {
                try {
                  onChange(JSON.parse(v))
                } catch {
                  /* keep typing; invalid JSON is flagged by the editor */
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
