import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUp,
  Bot,
  Brain,
  Check,
  ChevronRight,
  GitFork,
  History,
  Paperclip,
  Pencil,
  Plus,
  Square,
  Trash2,
  Users,
  Workflow,
  X
} from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { streamRun } from '@/lib/client'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { runsToMessages } from '@/lib/runs'
import type { ComponentRef, Session } from '@/lib/types'
import { cn, isContentEvent } from '@/lib/utils'
import { Markdown } from '@/components/Markdown'
import { ToolCallView, type ChatToolCall } from '@/components/ToolCall'
import { Drawer } from '@/components/data'
import { formatDateTime } from '@/lib/format'
import { Spinner } from '@/components/ui'

type Kind = 'agent' | 'team' | 'workflow'

interface WorkflowStep {
  name: string
  done: boolean
  content?: string
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  tools?: ChatToolCall[]
  steps?: WorkflowStep[]
}

function Reasoning({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-2 rounded-lg border border-border bg-inset">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 text-faint transition-transform', open && 'rotate-90')} />
        <Brain className="h-3.5 w-3.5 text-purple-400" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
          Reasoning
        </span>
      </button>
      {open && (
        <p className="whitespace-pre-wrap px-3 pb-2.5 pl-8 text-[12px] italic leading-relaxed text-faint">
          {text}
        </p>
      )}
    </div>
  )
}

function StepView({ step }: { step: WorkflowStep }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-inset">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 text-faint transition-transform', open && 'rotate-90')} />
        <Workflow className="h-3.5 w-3.5 text-accent" />
        <span className="flex-1 truncate font-mono text-[12px] text-fg">{step.name}</span>
        {step.done ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Spinner className="h-3.5 w-3.5 text-amber-400" />
        )}
      </button>
      {open && step.content && (
        <div className="border-t border-border px-3 py-2.5">
          <Markdown>{step.content}</Markdown>
        </div>
      )}
    </div>
  )
}

function SessionRow({
  sess,
  type,
  onPick,
  onChanged
}: {
  sess: Session
  type: Kind
  onPick: (id: string) => void
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(sess.session_name ?? '')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      await api.renameSession(sess.session_id, name.trim(), type)
      setEditing(false)
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  const del = async () => {
    setBusy(true)
    try {
      await api.deleteSession(sess.session_id)
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-accent/50 px-2 py-1.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="flex-1 bg-transparent text-[13px] text-fg outline-none"
        />
        <button onClick={save} disabled={busy} className="text-emerald-400 hover:text-emerald-300">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="text-faint hover:text-fg">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-1 rounded-md border border-border-soft px-3 py-2 hover:bg-hover">
      <button onClick={() => onPick(sess.session_id)} className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="line-clamp-1 text-[13px] text-fg">
          {sess.session_name || sess.session_id}
        </span>
        <span className="font-mono text-[11px] text-faint">
          {formatDateTime(sess.updated_at)}
        </span>
      </button>
      {confirmDel ? (
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-red-300">Delete?</span>
          <button onClick={del} disabled={busy} className="text-red-400 hover:text-red-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setConfirmDel(false)} className="text-faint hover:text-fg">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="hidden items-center gap-1.5 group-hover:flex">
          <button onClick={() => setEditing(true)} className="text-faint hover:text-fg" title="Rename">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setConfirmDel(true)} className="text-faint hover:text-red-300" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function SessionsPanel({
  open,
  onClose,
  type,
  componentId,
  componentName,
  onPick
}: {
  open: boolean
  onClose: () => void
  type: Kind
  componentId: string
  componentName: string
  onPick: (id: string) => void
}) {
  const { data, loading, error, reload } = useApi(
    (s) =>
      api.sessions(
        { type, component_id: componentId, sort_by: 'updated_at', sort_order: 'desc', limit: 50 },
        s
      ),
    [type, componentId, open]
  )
  const rows = open ? (data?.data ?? []) : []
  const total = data?.meta?.total_count
  return (
    <Drawer
      open={open}
      title={
        <span>
          Sessions · <span className="text-muted">{componentName}</span>
          {typeof total === 'number' && (
            <span className="ml-2 font-mono text-[11px] text-faint">{total}</span>
          )}
        </span>
      }
      onClose={onClose}
    >
      {loading && <Spinner className="h-4 w-4 text-faint" />}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-sm text-faint">No sessions for {componentName} yet.</p>
      )}
      <div className="space-y-1">
        {rows.map((sess: Session) => (
          <SessionRow
            key={sess.session_id}
            sess={sess}
            type={type}
            onPick={onPick}
            onChanged={reload}
          />
        ))}
      </div>
    </Drawer>
  )
}

export function Chat() {
  const { config } = useOS()
  const [params, setParams] = useSearchParams()
  const type = (params.get('type') as Kind) || 'agent'
  const id = params.get('id') || ''

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [streaming, setStreaming] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [loadingSession, setLoadingSession] = useState(false)
  const sessionId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const list: ComponentRef[] =
    (type === 'team'
      ? config?.teams
      : type === 'workflow'
        ? config?.workflows
        : config?.agents) ?? []
  const current = list.find((c) => c.id === id) ?? list[0]
  const manifest = current ? config?.manifest?.[current.id] : undefined

  useEffect(() => {
    if (!id && current) setParams({ type, id: current.id }, { replace: true })
  }, [id, current, type, setParams])

  useEffect(() => {
    setMessages([])
    sessionId.current = null
    abortRef.current?.abort()
    setStreaming(false)
  }, [type, id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const setType = (t: Kind) => {
    const first = (
      t === 'team' ? config?.teams : t === 'workflow' ? config?.workflows : config?.agents
    )?.[0]
    setParams({ type: t, id: first?.id ?? '' })
  }

  const patchLast = (fn: (m: ChatMsg) => ChatMsg) =>
    setMessages((m) => {
      if (m.length === 0) return m
      const c = [...m]
      c[c.length - 1] = fn(c[c.length - 1])
      return c
    })

  const loadSession = async (sid: string) => {
    setShowSessions(false)
    setLoadingSession(true)
    abortRef.current?.abort()
    try {
      const runs = await api.sessionRuns(sid)
      setMessages(runsToMessages(runs))
      sessionId.current = sid
    } catch {
      setMessages([{ role: 'assistant', content: '⚠️ Could not load session.' }])
    } finally {
      setLoadingSession(false)
    }
  }

  const send = async (text: string) => {
    if (!text.trim() || !current || streaming) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }])
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller

    const form = new FormData()
    form.set('message', text)
    form.set('stream', 'true')
    if (sessionId.current) form.set('session_id', sessionId.current)
    for (const f of files) form.append('files', f)
    setFiles([])

    const base =
      type === 'team' ? 'teams' : type === 'workflow' ? 'workflows' : 'agents'
    const path = `/${base}/${current.id}/runs`
    try {
      for await (const ev of streamRun(path, form, controller.signal)) {
        if (typeof ev.session_id === 'string') sessionId.current = ev.session_id
        const name = typeof ev.event === 'string' ? ev.event : ''

        if (name === 'StepStarted') {
          const stepName = String(ev.step_name ?? 'step')
          patchLast((m) => ({
            ...m,
            steps: [...(m.steps ?? []), { name: stepName, done: false }]
          }))
        } else if (name === 'StepCompleted') {
          const stepName = String(ev.step_name ?? '')
          const content = typeof ev.content === 'string' ? ev.content : undefined
          patchLast((m) => ({
            ...m,
            steps: (m.steps ?? []).map((st, i, arr) =>
              st.name === stepName && i === arr.length - 1
                ? { ...st, done: true, content }
                : st.name === stepName && !st.done
                  ? { ...st, done: true, content }
                  : st
            )
          }))
        } else if (name === 'WorkflowCompleted') {
          if (typeof ev.content === 'string') {
            const c = ev.content
            patchLast((m) => ({ ...m, content: c }))
          }
        } else if (name.endsWith('ToolCallStarted')) {
          const t = ev.tool as Record<string, unknown> | undefined
          if (t) {
            patchLast((m) => ({
              ...m,
              tools: [
                ...(m.tools ?? []),
                {
                  id: String(t.tool_call_id),
                  name: String(t.tool_name),
                  args: t.tool_args,
                  done: false
                }
              ]
            }))
          }
        } else if (name.endsWith('ToolCallCompleted')) {
          const t = ev.tool as Record<string, unknown> | undefined
          if (t) {
            const result =
              typeof t.result === 'string' ? t.result : JSON.stringify(t.result)
            patchLast((m) => ({
              ...m,
              tools: (m.tools ?? []).map((tc) =>
                tc.id === String(t.tool_call_id)
                  ? { ...tc, result, error: !!t.tool_call_error, done: true }
                  : tc
              )
            }))
          }
        } else if (isContentEvent(name) && typeof ev.content === 'string') {
          const delta = ev.content
          patchLast((m) => ({ ...m, content: m.content + delta }))
        }

        if (typeof ev.reasoning_content === 'string' && ev.reasoning_content) {
          const r = ev.reasoning_content
          patchLast((m) => ({ ...m, reasoning: (m.reasoning ?? '') + r }))
        }
      }
    } catch (err) {
      patchLast((m) =>
        m.role === 'assistant' && !m.content
          ? { ...m, content: `⚠️ ${(err as Error).message}` }
          : m
      )
    } finally {
      setStreaming(false)
    }
  }

  const newSession = () => {
    abortRef.current?.abort()
    sessionId.current = null
    setMessages([])
    setStreaming(false)
  }

  const fork = async () => {
    if (!current || !sessionId.current || type === 'workflow') return
    setLoadingSession(true)
    try {
      const res = await api.forkSession(type, current.id, sessionId.current)
      if (res.session_id) {
        sessionId.current = res.session_id
        const runs = await api.sessionRuns(res.session_id)
        setMessages(runsToMessages(runs))
      }
    } finally {
      setLoadingSession(false)
    }
  }

  const Picker = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as Kind)}
          className="rounded-md border border-border bg-panel px-2.5 py-1.5 text-[12px] text-muted outline-none hover:bg-hover"
        >
          <option value="agent">Agents</option>
          <option value="team">Teams</option>
          <option value="workflow">Workflows</option>
        </select>
        <select
          value={current?.id ?? ''}
          onChange={(e) => setParams({ type, id: e.target.value })}
          className="rounded-md border border-border bg-panel px-2.5 py-1.5 text-[13px] text-fg outline-none hover:bg-hover"
        >
          {list.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, current?.id, list]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-soft px-8 py-3">
        {Picker}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessions(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
          >
            <History className="h-3.5 w-3.5" />
            Sessions
          </button>
          {type !== 'workflow' && messages.length > 0 && (
            <button
              onClick={fork}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
            >
              <GitFork className="h-3.5 w-3.5" />
              Fork
            </button>
          )}
          <button
            onClick={newSession}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" />
            New session
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {loadingSession ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-5 w-5 text-faint" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-black">
                {type === 'team' ? <Users className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className="mt-4 text-lg font-semibold text-fg">
                {current?.name ?? 'Chat'}
              </div>
              {manifest?.description && (
                <p className="mt-1 max-w-md text-sm text-muted">{manifest.description}</p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {manifest?.quick_prompts?.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted hover:border-border hover:text-fg"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-accent px-4 py-2.5 text-[14px] leading-relaxed text-black">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="w-full max-w-[92%] space-y-2">
                      {m.reasoning && <Reasoning text={m.reasoning} />}
                      {m.steps?.map((st, si) => (
                        <StepView key={si} step={st} />
                      ))}
                      {m.tools?.map((t) => (
                        <ToolCallView key={t.id} call={t} />
                      ))}
                      {m.content ? (
                        <div className="rounded-2xl border border-border bg-card px-4 py-2.5 text-fg">
                          <Markdown>{m.content}</Markdown>
                        </div>
                      ) : (
                        !m.tools?.length &&
                        !m.steps?.length && (
                          <div className="inline-flex gap-1 rounded-2xl border border-border bg-card px-4 py-3 text-faint">
                            <Dot /> <Dot /> <Dot />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border-soft px-8 py-4">
        {files.length > 0 && (
          <div className="mx-auto mb-2 flex max-w-3xl flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-[11px] text-muted"
              >
                <Paperclip className="h-3 w-3" />
                {f.name}
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="text-faint hover:text-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-faint hover:bg-hover hover:text-fg">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                setFiles([...files, ...Array.from(e.target.files ?? [])])
                e.target.value = ''
              }}
            />
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder={`Message ${current?.name ?? '…'}`}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[14px] text-fg outline-none placeholder:text-faint"
          />
          {streaming ? (
            <button
              onClick={() => {
                abortRef.current?.abort()
                setStreaming(false)
              }}
              title="Stop"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-hoverstrong text-fg hover:bg-hoverstrong"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-center font-mono text-[10px] uppercase tracking-wider text-faint">
          {current ? `${type} · ${current.name}` : 'no component'}
        </div>
      </div>

      {current && (
        <SessionsPanel
          open={showSessions}
          onClose={() => setShowSessions(false)}
          type={type}
          componentId={current.id}
          componentName={current.name}
          onPick={loadSession}
        />
      )}
    </div>
  )
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint" />
}
