import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, CornerDownLeft, Search, Users, Workflow } from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { NAV } from '@/lib/nav'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  label: string
  hint: string
  icon: typeof Bot
  action: () => void
}

export function CommandPalette() {
  const { config } = useOS()
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

  const items = useMemo<Item[]>(() => {
    const list: Item[] = []
    for (const nav of NAV) {
      list.push({
        id: `nav-${nav.to}`,
        label: nav.label,
        hint: 'Page',
        icon: nav.icon as typeof Bot,
        action: () => navigate(nav.to)
      })
    }
    const push = (
      arr: { id: string; name: string }[] | undefined,
      kind: 'agent' | 'team' | 'workflow',
      icon: typeof Bot
    ) => {
      for (const c of arr ?? []) {
        list.push({
          id: `${kind}-${c.id}`,
          label: c.name,
          hint: kind[0].toUpperCase() + kind.slice(1),
          icon,
          action: () =>
            kind === 'workflow'
              ? navigate('/sessions')
              : navigate(`/chat?type=${kind}&id=${c.id}`)
        })
      }
    }
    push(config?.agents, 'agent', Bot)
    push(config?.teams, 'team', Users)
    push(config?.workflows, 'workflow', Workflow)
    return list
  }, [config, navigate])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items.slice(0, 8)
    return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 12)
  }, [items, query])

  useEffect(() => setCursor(0), [query])

  if (!open) return null

  const run = (i?: Item) => {
    if (!i) return
    i.action()
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden
      />
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
            placeholder="Search agents, teams, pages…"
            className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-faint"
          />
          <kbd className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-faint">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-faint">
              No matches
            </div>
          )}
          {filtered.map((i, idx) => {
            const Icon = i.icon
            return (
              <button
                key={i.id}
                onMouseEnter={() => setCursor(idx)}
                onClick={() => run(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
                  idx === cursor ? 'bg-white/5' : ''
                )}
              >
                <Icon className="h-4 w-4 text-muted" strokeWidth={1.75} />
                <span className="flex-1 text-[13px] text-white">{i.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                  {i.hint}
                </span>
                {idx === cursor && (
                  <CornerDownLeft className="h-3.5 w-3.5 text-faint" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
