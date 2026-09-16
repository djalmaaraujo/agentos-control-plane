import { Bot, Users, Workflow as WorkflowIcon } from 'lucide-react'
import type { ComponentRef, ManifestEntry } from '@/lib/types'
import { modelLabel } from '@/lib/utils'
import { Badge, Card, PillButton } from './ui'

type Kind = 'agent' | 'team' | 'workflow'

const ICON = {
  agent: Bot,
  team: Users,
  workflow: WorkflowIcon
}

export function ComponentCard({
  kind,
  component,
  manifest,
  onChat,
  onConfig
}: {
  kind: Kind
  component: ComponentRef
  manifest?: ManifestEntry
  onChat?: () => void
  onConfig?: () => void
}) {
  const Icon = ICON[kind]
  const model = modelLabel(component.model)
  const description = manifest?.description

  return (
    <Card className="flex min-h-[128px] flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-black">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="font-medium text-white">{component.name}</span>
        </div>
        {model && <Badge>{model}</Badge>}
      </div>

      {description && (
        <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}

      <div className="mt-auto flex gap-2 pt-4">
        {onChat && <PillButton onClick={onChat}>Chat</PillButton>}
        <PillButton onClick={onConfig}>Config</PillButton>
      </div>
    </Card>
  )
}
