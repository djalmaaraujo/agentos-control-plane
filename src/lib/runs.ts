export interface Msg {
  role: 'user' | 'assistant'
  content: string
  at?: string | number
}

interface RunLike {
  run_input?: unknown
  content?: unknown
  created_at?: string | number
}

function asText(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return JSON.stringify(v)
}

// Flatten a session's runs into a turn-by-turn conversation. Each run carries the
// user turn in `run_input` and the assistant reply in `content`.
export function runsToMessages(data: unknown): Msg[] {
  const runs: RunLike[] = Array.isArray(data)
    ? (data as RunLike[])
    : Array.isArray((data as { data?: unknown })?.data)
      ? ((data as { data: RunLike[] }).data)
      : []

  const sorted = [...runs].sort((a, b) => {
    const ta = Number(a.created_at ?? 0)
    const tb = Number(b.created_at ?? 0)
    return ta - tb
  })

  const messages: Msg[] = []
  for (const run of sorted) {
    const input = asText(run.run_input)
    if (input) messages.push({ role: 'user', content: input, at: run.created_at })
    const content = asText(run.content)
    if (content)
      messages.push({ role: 'assistant', content, at: run.created_at })
  }
  return messages
}
