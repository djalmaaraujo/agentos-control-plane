import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type NodeChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Bot, ChevronDown, ChevronUp, Users, Workflow, Wrench, X } from 'lucide-react'
import type { ComponentType } from '@/lib/types'

type Config = Record<string, unknown>
type XY = { x: number; y: number }
interface StepLike {
  name?: string
  agent_id?: string
  team_id?: string
  function_name?: string
}
interface DragItem {
  kind: 'agent' | 'team' | 'function'
  id: string
  name: string
}

// ---- custom nodes -------------------------------------------------------

function RootNode({ data }: NodeProps) {
  const d = data as { label: string; type: ComponentType }
  const Icon = d.type === 'team' ? Users : Workflow
  return (
    <div className="min-w-[180px] rounded-lg border border-accent bg-card px-3 py-2.5 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-black">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-white">{d.label}</div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-faint">{d.type}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-accent" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  )
}

function MemberNode({ data }: NodeProps) {
  const d = data as { label: string; onRemove: () => void }
  return (
    <div className="group flex min-w-[160px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow">
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <Bot className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      <span className="flex-1 truncate text-[12px] text-white">{d.label}</span>
      <button
        onClick={d.onRemove}
        className="text-faint opacity-0 hover:text-red-300 group-hover:opacity-100"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function StepNode({ data }: NodeProps) {
  const d = data as {
    label: string
    sub?: string
    kind?: string
    first: boolean
    last: boolean
    onRemove: () => void
    onUp: () => void
    onDown: () => void
  }
  const Icon = d.kind === 'team' ? Users : d.kind === 'function' ? Wrench : Bot
  return (
    <div className="group min-w-[210px] rounded-lg border border-border bg-card px-3 py-2 shadow">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        <span className="flex-1 truncate text-[12px] text-white">{d.label}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button onClick={d.onUp} disabled={d.first} className="text-faint hover:text-white disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={d.onDown} disabled={d.last} className="text-faint hover:text-white disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={d.onRemove} className="text-faint hover:text-red-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {d.sub && <div className="mt-0.5 pl-5 font-mono text-[10px] text-faint">{d.sub}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}

const nodeTypes = { root: RootNode, member: MemberNode, step: StepNode }

// ---- palette ------------------------------------------------------------

function PaletteItem({ item, icon: Icon }: { item: DragItem; icon: typeof Bot }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/studio', JSON.stringify(item))
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="flex cursor-grab items-center gap-1.5 rounded border border-border bg-black/30 px-2 py-1 font-mono text-[11px] text-muted hover:border-accent hover:text-white active:cursor-grabbing"
    >
      <Icon className="h-3 w-3 text-accent" />
      {item.name}
    </div>
  )
}

function Palette({
  type,
  members,
  agents,
  teams,
  functions
}: {
  type: ComponentType
  members: string[]
  agents: { id: string; name?: string }[]
  teams: { id: string; name?: string }[]
  functions: string[]
}) {
  const availableAgents = agents.filter((a) => !(type === 'team' && members.includes(a.id)))
  return (
    <div className="absolute left-3 top-3 z-10 max-h-[calc(100%-24px)] w-52 overflow-y-auto rounded-lg border border-border bg-panel/95 p-2.5 backdrop-blur">
      <div className="label mb-1.5">Drag to add</div>
      <div className="space-y-2">
        <div>
          <div className="mb-1 font-mono text-[9px] uppercase text-faint">Agents</div>
          <div className="flex flex-wrap gap-1">
            {availableAgents.map((a) => (
              <PaletteItem
                key={a.id}
                icon={Bot}
                item={{ kind: 'agent', id: a.id, name: a.name ?? a.id }}
              />
            ))}
            {availableAgents.length === 0 && <span className="text-[11px] text-faint">—</span>}
          </div>
        </div>
        {type === 'workflow' && (
          <>
            <div>
              <div className="mb-1 font-mono text-[9px] uppercase text-faint">Teams</div>
              <div className="flex flex-wrap gap-1">
                {teams.map((t) => (
                  <PaletteItem
                    key={t.id}
                    icon={Users}
                    item={{ kind: 'team', id: t.id, name: t.name ?? t.id }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[9px] uppercase text-faint">Functions</div>
              <div className="flex flex-wrap gap-1">
                {functions.map((f) => (
                  <PaletteItem key={f} icon={Wrench} item={{ kind: 'function', id: f, name: f }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- canvas -------------------------------------------------------------

function Canvas({
  type,
  name,
  config,
  onChange,
  agents,
  teams,
  functions
}: {
  type: ComponentType
  name: string
  config: Config
  onChange: (c: Config) => void
  agents: { id: string; name?: string }[]
  teams: { id: string; name?: string }[]
  functions: string[]
}) {
  const { screenToFlowPosition } = useReactFlow()
  const members = Array.isArray(config.members) ? (config.members as string[]) : []
  const steps = Array.isArray(config.steps) ? (config.steps as StepLike[]) : []
  const savedLayout =
    ((config.metadata as Record<string, unknown> | undefined)?.studio_layout as
      | Record<string, XY>
      | undefined) ?? {}
  const [pos, setPos] = useState<Record<string, XY>>(savedLayout)

  const setMembers = (m: string[]) => onChange({ ...config, members: m })
  const setSteps = (s: StepLike[]) => onChange({ ...config, steps: s })
  const persistLayout = () =>
    onChange({
      ...config,
      metadata: { ...((config.metadata as object) ?? {}), studio_layout: pos }
    })

  const at = (id: string, fallback: XY) => pos[id] ?? fallback

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    if (type === 'team') {
      nodes.push({
        id: '__root',
        type: 'root',
        position: at('__root', { x: 0, y: Math.max(0, (members.length - 1) * 45) }),
        data: { label: name, type }
      })
      members.forEach((m, i) => {
        const id = `m-${m}`
        nodes.push({
          id,
          type: 'member',
          position: at(id, { x: 340, y: i * 90 }),
          data: {
            label: agents.find((a) => a.id === m)?.name ?? m,
            onRemove: () => setMembers(members.filter((x) => x !== m))
          }
        })
        edges.push({ id: `e-${id}`, source: '__root', target: id, animated: true })
      })
    } else {
      nodes.push({ id: '__root', type: 'root', position: at('__root', { x: 40, y: 0 }), data: { label: name, type } })
      let prev = '__root'
      steps.forEach((st, i) => {
        const id = `s-${i}`
        const kind = st.team_id ? 'team' : st.function_name ? 'function' : 'agent'
        nodes.push({
          id,
          type: 'step',
          position: at(id, { x: 20, y: 120 + i * 110 }),
          data: {
            label: st.name || `Step ${i + 1}`,
            sub: st.agent_id || st.team_id || st.function_name || '',
            kind,
            first: i === 0,
            last: i === steps.length - 1,
            onRemove: () => setSteps(steps.filter((_, idx) => idx !== i)),
            onUp: () => {
              if (i === 0) return
              const s = [...steps]
              ;[s[i - 1], s[i]] = [s[i], s[i - 1]]
              setSteps(s)
            },
            onDown: () => {
              if (i === steps.length - 1) return
              const s = [...steps]
              ;[s[i + 1], s[i]] = [s[i], s[i + 1]]
              setSteps(s)
            }
          }
        })
        edges.push({ id: `es-${i}`, source: prev, target: id, animated: true })
        prev = id
      })
    }
    return { nodes, edges }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, name, JSON.stringify(config), pos, agents])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setPos((prev) => {
        let next = prev
        for (const c of changes) {
          if (c.type === 'position' && c.position) next = { ...next, [c.id]: c.position }
        }
        return next
      })
      const removed = changes
        .filter((c): c is NodeChange & { type: 'remove'; id: string } => c.type === 'remove')
        .map((c) => c.id)
      if (removed.length) {
        if (type === 'team') {
          setMembers(members.filter((m) => !removed.includes(`m-${m}`)))
        } else {
          setSteps(steps.filter((_, i) => !removed.includes(`s-${i}`)))
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, JSON.stringify(config)]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/studio')
      if (!raw) return
      const item = JSON.parse(raw) as DragItem
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      if (type === 'team') {
        if (item.kind !== 'agent' || members.includes(item.id)) return
        setPos((p) => ({ ...p, [`m-${item.id}`]: position }))
        setMembers([...members, item.id])
      } else {
        const step: StepLike = { name: item.name }
        if (item.kind === 'agent') step.agent_id = item.id
        if (item.kind === 'team') step.team_id = item.id
        if (item.kind === 'function') step.function_name = item.id
        setPos((p) => ({ ...p, [`s-${steps.length}`]: position }))
        setSteps([...steps, step])
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, JSON.stringify(config), screenToFlowPosition]
  )

  return (
    <div
      className="relative h-full w-full"
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
    >
      <Palette type={type} members={members} agents={agents} teams={teams} functions={functions} />
      {(type === 'team' ? members.length === 0 : steps.length === 0) && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <span className="text-[13px] text-faint">
            Drag {type === 'team' ? 'agents' : 'agents, teams or functions'} from the palette
          </span>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={persistLayout}
        fitView
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        className="bg-bg"
      >
        <Background color="#242427" gap={18} />
        <Controls showInteractive={false} className="!border-border !bg-panel" />
      </ReactFlow>
    </div>
  )
}

export function StudioCanvas(props: {
  type: ComponentType
  name: string
  config: Config
  onChange: (c: Config) => void
  agents: { id: string; name?: string }[]
  teams: { id: string; name?: string }[]
  functions: string[]
}) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}
