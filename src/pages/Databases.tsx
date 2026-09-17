import { useState } from 'react'
import { Database, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useOS } from '@/lib/osContext'
import { PageHeader } from '@/components/data'

function DbRow({ db }: { db: string }) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const migrate = async () => {
    setBusy(true)
    setDone(null)
    try {
      await api.migrateDatabase(db)
      setDone('Migrated')
    } catch {
      setDone('Failed')
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Database className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <span className="font-mono text-[13px] text-fg">{db}</span>
      </div>
      <div className="flex items-center gap-2">
        {done && (
          <span className={done === 'Migrated' ? 'text-[12px] text-emerald-400' : 'text-[12px] text-red-300'}>
            {done}
          </span>
        )}
        {confirm ? (
          <>
            <span className="text-[12px] text-muted">Run migrations?</span>
            <button
              onClick={migrate}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black disabled:opacity-40"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:bg-hover"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted hover:bg-hover hover:text-fg"
          >
            Migrate
          </button>
        )}
      </div>
    </div>
  )
}

export function Databases() {
  const { config } = useOS()
  const dbs = config?.databases ?? []

  return (
    <div>
      <PageHeader title="Databases">
        <span className="text-[12px] text-faint">
          Run schema migrations for the OS databases. Safe to re-run (idempotent).
        </span>
      </PageHeader>
      <div className="mx-auto max-w-3xl space-y-3 px-8 py-6">
        {dbs.length === 0 ? (
          <p className="text-sm text-faint">No databases reported.</p>
        ) : (
          dbs.map((db) => <DbRow key={db} db={db} />)
        )}
      </div>
    </div>
  )
}
