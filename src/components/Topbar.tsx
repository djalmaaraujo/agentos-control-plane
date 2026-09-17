import { RefreshCw, Search } from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { cn } from '@/lib/utils'
import { OSSwitcher } from './OSSwitcher'

export function Topbar() {
  const { loading, refresh } = useOS()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-soft bg-panel px-6">
      <OSSwitcher />

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event('cp:open-search'))}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="ml-1 rounded bg-inset px-1 text-[10px] text-faint">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>
    </header>
  )
}
