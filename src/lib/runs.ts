export interface MediaItem {
  kind: 'image' | 'video' | 'audio' | 'file'
  filename?: string
  mime_type?: string
  content?: string // base64
  url?: string
  storage_key?: string
}

export interface Msg {
  role: 'user' | 'assistant'
  content: string
  at?: string | number
  media?: MediaItem[]
}

interface RunLike {
  run_input?: unknown
  content?: unknown
  created_at?: string | number
  images?: unknown[]
  videos?: unknown[]
  audio?: unknown[]
  audios?: unknown[]
  files?: unknown[]
  input_media?: {
    images?: unknown[]
    videos?: unknown[]
    audios?: unknown[]
    files?: unknown[]
  }
}

function asText(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return JSON.stringify(v)
}

function toMedia(kind: MediaItem['kind'], list: unknown): MediaItem[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
    .map((it) => ({
      kind,
      filename: typeof it.filename === 'string' ? it.filename : undefined,
      mime_type: typeof it.mime_type === 'string' ? it.mime_type : undefined,
      content: typeof it.content === 'string' ? it.content : undefined,
      url: typeof it.url === 'string' ? it.url : undefined,
      storage_key: typeof it.storage_key === 'string' ? it.storage_key : undefined
    }))
}

function outputMedia(run: RunLike): MediaItem[] {
  return [
    ...toMedia('image', run.images),
    ...toMedia('video', run.videos),
    ...toMedia('audio', run.audio ?? run.audios),
    ...toMedia('file', run.files)
  ]
}

function inputMedia(run: RunLike): MediaItem[] {
  const im = run.input_media
  if (!im) return []
  return [
    ...toMedia('image', im.images),
    ...toMedia('video', im.videos),
    ...toMedia('audio', im.audios),
    ...toMedia('file', im.files)
  ]
}

// Flatten a session's runs into a turn-by-turn conversation. Each run carries the
// user turn in `run_input` and the assistant reply in `content`; media rides along.
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
    const inMedia = inputMedia(run)
    if (input || inMedia.length)
      messages.push({
        role: 'user',
        content: input,
        at: run.created_at,
        ...(inMedia.length ? { media: inMedia } : {})
      })
    const content = asText(run.content)
    const outMedia = outputMedia(run)
    if (content || outMedia.length)
      messages.push({
        role: 'assistant',
        content,
        at: run.created_at,
        ...(outMedia.length ? { media: outMedia } : {})
      })
  }
  return messages
}
