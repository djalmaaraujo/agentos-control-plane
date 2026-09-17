import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  CornerDownLeft,
  Globe,
  MessageSquare,
  Search,
  Users,
  Workflow
} from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { NAV } from '@/lib/nav'
import type { Session } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  label: string
  group: string
  icon: typeof Bot
  action: () => void
}

export function CommandPalette() {
  const { config, servers, active, setActive } = useOS()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('cp:open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('cp:open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  const recents = useApi(
    (s) => api.sessions({ sort_by: 'updated_at', sort_order: 'desc', limit: 5 }, s),
    [open]
  )

  const items = useMemo<Item[]>(() => {
    const list: Item[] = []
    for (const sess of open ? (recents.data?.data ?? []) : []) {
      const s = sess as Session
      list.push({
        id: `recent-${s.session_id}`,
        label: s.session_name || s.session_id,
        group: 'Recents',
        icon: MessageSquare,
        action: () => navigate('/sessions')
      })
    }
    for (const nav of NAV) {
      list.push({
        id: `nav-${nav.to}`,
        label: nav.label,
        group: 'Pages',
        icon: nav.icon as typeof Bot,
        action: () => navigate(nav.to)
      })
    }
    const push = (
      arr: { id: string; name: string }[] | undefined,
      kind: 'agent' | 'team' | 'workflow',
      group: string,
      icon: typeof Bot
    ) => {
      for (const c of arr ?? [])
        list.push({
          id: `${kind}-${c.id}`,
          label: c.name,
          group,
          icon,
          action: () => navigate(`/chat?type=${kind}&id=${c.id}`)
        })
    }
    push(config?.agents, 'agent', 'Agents', Bot)
    push(config?.teams, 'team', 'Teams', Users)
    push(config?.workflows, 'workflow', 'Workflows', Workflow)
    for (const srv of servers)
      list.push({
        id: `srv-${srv.id}`,
        label: `Switch to ${srv.name}${srv.id === active.id ? ' (current)' : ''}`,
        group: 'Servers',
        icon: Globe,
        action: () => setActive(srv.id)
      })
    return list
  }, [open, recents.data, config, servers, active.id, navigate, setActive])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return items.slice(0, 12)
    return items.filter((i) => i.label.toLowerCase().includes(term)).slice(0, 14)
  }, [items, query])

  useEffect(() => setCursor(0), [query])

  if (!open) return null

  const run = (i?: Item) => {
    if (!i) return
    i.action()
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(c + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(c - 1, 0))
              } else if (e.key === 'Enter') {
                run(filtered[cursor])
              }
            }}
            placeholder="Type a command or search…"
            className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-faint"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-faint">No matches</div>
          )}
          {filtered.map((i, idx) => {
            const Icon = i.icon
            const showHeader = idx === 0 || filtered[idx - 1].group !== i.group
            return (
              <div key={i.id}>
                {showHeader && (
                  <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-faint">
                    {i.group}
                  </div>
                )}
                <button
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => run(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
                    idx === cursor ? 'bg-hover' : ''
                  )}
                >
                  <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
                  <span className="flex-1 truncate text-[13px] text-fg">{i.label}</span>
                  {idx === cursor && <CornerDownLeft className="h-3.5 w-3.5 text-faint" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            {active.name}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-faint">
            <CornerDownLeft className="h-3 w-3" /> select · esc close
          </span>
        </div>
      </div>
    </div>
  )
}
