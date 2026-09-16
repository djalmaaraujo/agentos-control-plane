import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useOS } from '@/lib/osContext'
import type { ComponentRef, OSConfig } from '@/lib/types'
import { ComponentCard } from '@/components/ComponentCard'
import { ConfigDrawer } from '@/components/ConfigDrawer'
import {
  Card,
  EmptyState,
  ErrorState,
  SectionHeader,
  Spinner
} from '@/components/ui'

const COLLAPSE_AT = 6

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  )
}

function ComponentSection({
  title,
  kind,
  items,
  config,
  onChat,
  onConfig
}: {
  title: string
  kind: 'agent' | 'team' | 'workflow'
  items: ComponentRef[]
  config: OSConfig
  onChat: (kind: 'agent' | 'team' | 'workflow', c: ComponentRef) => void
  onConfig: (kind: 'agent' | 'team' | 'workflow', c: ComponentRef) => void
}) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  const collapsible = items.length > COLLAPSE_AT
  const shown = collapsible && !expanded ? items.slice(0, COLLAPSE_AT) : items

  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      <Grid>
        {shown.map((c) => (
          <ComponentCard
            key={c.id}
            kind={kind}
            component={c}
            manifest={config.manifest?.[c.id]}
            onChat={kind === 'workflow' ? undefined : () => onChat(kind, c)}
            onConfig={() => onConfig(kind, c)}
          />
        ))}
      </Grid>
      {collapsible && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-white/5 hover:text-white"
        >
          {expanded ? 'Show less' : `Show more (+${items.length - COLLAPSE_AT})`}
        </button>
      )}
    </section>
  )
}

function InterfacesSection({ config }: { config: OSConfig }) {
  const interfaces = config.interfaces ?? []
  if (interfaces.length === 0) return null
  return (
    <section>
      <SectionHeader>Interfaces</SectionHeader>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {interfaces.map((iface) => (
          <Card
            key={iface.route}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#242427] text-muted">
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {iface.type}
              </span>
            </div>
            <span className="font-mono text-[13px] text-faint">
              {iface.route}
            </span>
          </Card>
        ))}
      </div>
    </section>
  )
}

export function Home() {
  const { config: data, loading, error, refresh } = useOS()
  const navigate = useNavigate()
  const reload = refresh
  const [configTarget, setConfigTarget] = useState<{
    kind: 'agent' | 'team' | 'workflow'
    component: ComponentRef
  } | null>(null)

  const goChat = (kind: 'agent' | 'team' | 'workflow', c: ComponentRef) =>
    navigate(`/chat?type=${kind}&id=${c.id}`)
  const openConfig = (
    kind: 'agent' | 'team' | 'workflow',
    component: ComponentRef
  ) => setConfigTarget({ kind, component })

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center text-faint">
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-10">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  if (!data) return null

  const isEmpty =
    !(data.agents?.length || data.teams?.length || data.workflows?.length)

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      {isEmpty ? (
        <EmptyState>
          This AgentOS has no agents, teams or workflows registered yet.
        </EmptyState>
      ) : (
        <div className="space-y-2">
          <ComponentSection
            title="Agents"
            kind="agent"
            items={data.agents ?? []}
            config={data}
            onChat={goChat}
            onConfig={openConfig}
          />
          <ComponentSection
            title="Teams"
            kind="team"
            items={data.teams ?? []}
            config={data}
            onChat={goChat}
            onConfig={openConfig}
          />
          <ComponentSection
            title="Workflows"
            kind="workflow"
            items={data.workflows ?? []}
            config={data}
            onChat={goChat}
            onConfig={openConfig}
          />
          <InterfacesSection config={data} />
        </div>
      )}
      <ConfigDrawer target={configTarget} onClose={() => setConfigTarget(null)} />
    </div>
  )
}
