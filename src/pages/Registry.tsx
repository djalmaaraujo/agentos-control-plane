import { useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import type { RegistryItem } from '@/lib/types'
import { PageHeader, Drawer, JsonBlock } from '@/components/data'
import { Card, Spinner, ErrorState, SectionHeader } from '@/components/ui'

const GROUP_ORDER = [
  'model',
  'tool',
  'function',
  'db',
  'knowledge',
  'learning',
  'agent',
  'team',
  'workflow'
]
const GROUP_LABEL: Record<string, string> = {
  model: 'Models',
  tool: 'Tools',
  function: 'Functions',
  db: 'Databases',
  knowledge: 'Knowledge',
  learning: 'Learning',
  agent: 'Agents',
  team: 'Teams',
  workflow: 'Workflows'
}

function RegistryCard({
  item,
  onOpen
}: {
  item: RegistryItem
  onOpen: () => void
}) {
  const fns = item.metadata?.functions ?? []
  const shown = fns.slice(0, 6)
  return (
    <Card className="flex flex-col p-4">
      <div className="font-medium text-fg">{item.name}</div>
      <div className="mt-1.5">
        <span className="rounded border border-border bg-inset px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
          {item.metadata?.id || item.name}
        </span>
      </div>
      {shown.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {shown.map((f) => (
            <span
              key={f.name}
              className="rounded border border-border-soft bg-inset px-1.5 py-0.5 font-mono text-[10px] uppercase text-faint"
            >
              {f.name}
            </span>
          ))}
          {fns.length > shown.length && (
            <span className="font-mono text-[10px] text-faint">
              +{fns.length - shown.length}
            </span>
          )}
        </div>
      )}
      <button
        onClick={onOpen}
        className="mt-4 self-start font-mono text-[10px] uppercase tracking-wider text-faint hover:text-fg"
      >
        See details ↗
      </button>
    </Card>
  )
}

export function Registry() {
  const { data, loading, error, reload } = useApi(
    (s) => api.registry({ limit: 100 }, s),
    []
  )
  const [selected, setSelected] = useState<RegistryItem | null>(null)

  const groups = useMemo(() => {
    const by: Record<string, RegistryItem[]> = {}
    for (const it of data?.data ?? []) {
      const t = it.type || 'other'
      ;(by[t] ??= []).push(it)
    }
    const keys = [
      ...GROUP_ORDER.filter((k) => by[k]),
      ...Object.keys(by).filter((k) => !GROUP_ORDER.includes(k))
    ]
    return keys.map((k) => ({ key: k, label: GROUP_LABEL[k] ?? k, items: by[k] }))
  }, [data])

  return (
    <div>
      <PageHeader title="Studio · Registry">
        <span className="text-[12px] text-faint">
          Tools, models and resources this OS can build with.{' '}
          {data?.meta?.total_count ?? 0} total.
        </span>
      </PageHeader>

      <div className="px-8 py-6">
        {loading && !data && (
          <div className="flex justify-center py-16">
            <Spinner className="h-5 w-5 text-faint" />
          </div>
        )}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data &&
          groups.map((g) => (
            <section key={g.key}>
              <SectionHeader>{g.label}</SectionHeader>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((it) => (
                  <RegistryCard key={it.id} item={it} onOpen={() => setSelected(it)} />
                ))}
              </div>
            </section>
          ))}
      </div>

      <Drawer
        open={!!selected}
        title={<span className="font-mono text-[13px]">{selected?.name}</span>}
        onClose={() => setSelected(null)}
      >
        {selected && <JsonBlock value={selected} />}
      </Drawer>
    </div>
  )
}
