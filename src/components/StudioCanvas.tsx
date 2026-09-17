import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Bot, ChevronDown, ChevronUp, Plus, Users, Workflow, X } from 'lucide-react'
import type { ComponentType } from '@/lib/types'

type Config = Record<string, unknown>

interface StepLike {
  name?: string
  agent_id?: string
  team_id?: string
  function_name?: string
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
          <div className="font-mono text-[9px] uppercase tracking-wider text-faint">
            {d.type}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-accent" />
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
        title="Remove member"
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
    first: boolean
    last: boolean
    onRemove: () => void
    onUp: () => void
    onDown: () => void
  }
  return (
    <div className="group min-w-[200px] rounded-lg border border-border bg-card px-3 py-2 shadow">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-center gap-2">
        <Workflow className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
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

// ---- canvas -------------------------------------------------------------

export function StudioCanvas({
  type,
  name,
  config,
  onChange,
  agents
}: {
  type: ComponentType
  name: string
  config: Config
  onChange: (c: Config) => void
  agents: { id: string; name?: string }[]
}) {
  const members = Array.isArray(config.members) ? (config.members as string[]) : []
  const steps = Array.isArray(config.steps) ? (config.steps as StepLike[]) : []

  const setMembers = (m: string[]) => onChange({ ...config, members: m })
  const setSteps = (s: StepLike[]) => onChange({ ...config, steps: s })

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    if (type === 'team') {
      nodes.push({
        id: '__root',
        type: 'root',
        position: { x: 0, y: Math.max(0, (members.length - 1) * 45) },
        data: { label: name, type }
      })
      members.forEach((m, i) => {
        nodes.push({
          id: `m-${m}-${i}`,
          type: 'member',
          position: { x: 320, y: i * 90 },
          data: {
            label: agents.find((a) => a.id === m)?.name ?? m,
            onRemove: () => setMembers(members.filter((_, idx) => idx !== i))
          }
        })
        edges.push({ id: `e-${i}`, source: '__root', target: `m-${m}-${i}`, animated: true })
      })
    } else {
      // workflow: root then a vertical chain of steps
      nodes.push({ id: '__root', type: 'root', position: { x: 40, y: 0 }, data: { label: name, type } })
      let prev = '__root'
      steps.forEach((st, i) => {
        const id = `s-${i}`
        const label = st.name || `Step ${i + 1}`
        const sub = st.agent_id || st.team_id || st.function_name || ''
        nodes.push({
          id,
          type: 'step',
          position: { x: 20, y: 110 + i * 110 },
          data: {
            label,
            sub,
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
  }, [type, name, JSON.stringify(config), agents])

  const available = agents.filter((a) => !members.includes(a.id))

  return (
    <div className="relative h-full w-full">
      {type === 'team' && available.length > 0 && (
        <div className="absolute left-3 top-3 z-10">
          <select
            value=""
            onChange={(e) => e.target.value && setMembers([...members, e.target.value])}
            className="flex items-center gap-1 rounded-md border border-border bg-panel px-2 py-1.5 text-[12px] text-muted outline-none hover:bg-white/5"
          >
            <option value="">+ Add member</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.id}
              </option>
            ))}
          </select>
        </div>
      )}
      {(type === 'team' ? members.length === 0 : steps.length === 0) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="flex items-center gap-2 text-[13px] text-faint">
            <Plus className="h-4 w-4" />
            {type === 'team' ? 'Add members to build the team' : 'This workflow has no steps yet'}
          </span>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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
