import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Globe, Plus, Trash2 } from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { cn } from '@/lib/utils'

export function OSSwitcher() {
  const { servers, active, setActive, addServer, removeServer, info, healthy, loading } =
    useOS()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [base, setBase] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const label = active.id === 'default' ? (info?.name ?? active.name) : active.name

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-white/5"
      >
        <Globe className="h-4 w-4 text-muted" strokeWidth={1.75} />
        <span className="text-sm font-medium text-white">{label}</span>
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            loading ? 'bg-amber-400' : healthy ? 'bg-emerald-400' : 'bg-red-500'
          )}
        />
        <ChevronsUpDown className="h-3.5 w-3.5 text-faint" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-lg border border-border bg-panel p-1.5 shadow-2xl">
          <div className="px-2 py-1.5">
            <span className="label">Servers</span>
          </div>
          {servers.map((s) => (
            <div
              key={s.id}
              className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/5"
            >
              <button
                onClick={() => {
                  setActive(s.id)
                  setOpen(false)
                }}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    s.id === active.id ? 'text-accent' : 'text-transparent'
                  )}
                />
                <span className="truncate text-[13px] text-white">{s.name}</span>
                <span className="truncate font-mono text-[10px] text-faint">
                  {s.apiBase}
                </span>
              </button>
              {s.removable && (
                <button
                  onClick={() => removeServer(s.id)}
                  className="ml-1 hidden rounded p-1 text-faint hover:text-red-300 group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <div className="my-1 border-t border-border-soft" />
          {adding ? (
            <div className="space-y-1.5 p-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded border border-border bg-black/40 px-2 py-1.5 text-[13px] text-white outline-none focus:border-accent"
              />
              <input
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="https://os.example.com or /api"
                className="w-full rounded border border-border bg-black/40 px-2 py-1.5 font-mono text-[12px] text-white outline-none focus:border-accent"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    if (name && base) {
                      addServer(name.trim(), base.trim())
                      setName('')
                      setBase('')
                      setAdding(false)
                    }
                  }}
                  className="flex-1 rounded bg-accent px-2 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="rounded border border-border px-2 py-1.5 text-[12px] text-muted hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted hover:bg-white/5 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add server
            </button>
          )}
        </div>
      )}
    </div>
  )
}
