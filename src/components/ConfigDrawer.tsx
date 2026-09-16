import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { modelLabel } from '@/lib/utils'
import type { ComponentDetail, ComponentRef } from '@/lib/types'
import { Drawer, JsonBlock } from './data'
import { Badge, Spinner } from './ui'

type Kind = 'agent' | 'team' | 'workflow'

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className="text-[13px] text-muted">{value ?? '—'}</div>
    </div>
  )
}

function Detail({ kind, id }: { kind: Kind; id: string }) {
  const { data, loading, error } = useApi<ComponentDetail>(
    (s) => (kind === 'team' ? api.team(id, s) : api.agent(id, s)),
    [kind, id]
  )

  if (loading) return <Spinner className="h-4 w-4 text-faint" />
  if (error) return <p className="text-sm text-red-300">{error}</p>
  if (!data) return null

  const tools = data.tools?.tools ?? []
  const instructions = data.system_message?.instructions

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="ID" value={<span className="font-mono text-[12px]">{data.id}</span>} />
        <Field label="Model" value={modelLabel(data.model) || '—'} />
        <Field
          label="Reasoning"
          value={data.reasoning?.reasoning ? 'On' : 'Off'}
        />
        <Field
          label="History"
          value={
            data.sessions?.add_history_to_context
              ? `${data.sessions?.num_history_runs ?? '—'} runs`
              : 'Off'
          }
        />
      </div>

      {data.members && data.members.length > 0 && (
        <div>
          <div className="label mb-2">Members</div>
          <div className="flex flex-wrap gap-1.5">
            {data.members.map((m) => (
              <span
                key={m.id}
                className="rounded border border-border bg-black/30 px-2 py-1 text-[12px] text-muted"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="label mb-2">Tools ({tools.length})</div>
        {tools.length === 0 ? (
          <p className="text-[13px] text-faint">No tools.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <span
                key={t.name}
                className="rounded border border-border bg-black/30 px-2 py-1 font-mono text-[11px] text-muted"
                title={t.requires_confirmation ? 'Requires approval' : undefined}
              >
                {t.name}
                {t.requires_confirmation && (
                  <span className="ml-1 text-accent">•</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {instructions && (
        <div>
          <div className="label mb-2">Instructions</div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-black/40 p-3 text-[12px] leading-relaxed text-muted">
            {instructions}
          </pre>
        </div>
      )}
    </div>
  )
}

export function ConfigDrawer({
  target,
  onClose
}: {
  target: { kind: Kind; component: ComponentRef } | null
  onClose: () => void
}) {
  return (
    <Drawer
      open={!!target}
      title={
        target && (
          <span className="flex items-center gap-2">
            {target.component.name}
            <Badge>{target.kind}</Badge>
          </span>
        )
      }
      onClose={onClose}
    >
      {target &&
        (target.kind === 'workflow' ? (
          <JsonBlock value={target.component} />
        ) : (
          <Detail kind={target.kind} id={target.component.id} />
        ))}
    </Drawer>
  )
}
