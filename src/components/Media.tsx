import { Paperclip } from 'lucide-react'
import type { MediaItem } from '@/lib/runs'

function srcOf(m: MediaItem): string | null {
  if (m.url) return m.url
  if (m.content) return `data:${m.mime_type || 'application/octet-stream'};base64,${m.content}`
  return null
}

// Render the media attached to a run turn: images/video/audio inline, other
// files as a download chip. Handles inline base64 and URLs.
export function MediaView({ items }: { items?: MediaItem[] }) {
  const media = items ?? []
  if (media.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {media.map((m, i) => {
        const src = srcOf(m)
        if (m.kind === 'image' && src)
          return (
            <img
              key={i}
              src={src}
              alt={m.filename || 'image'}
              className="max-h-56 rounded-lg border border-border"
            />
          )
        if (m.kind === 'video' && src)
          return (
            <video
              key={i}
              src={src}
              controls
              className="max-h-56 rounded-lg border border-border"
            />
          )
        if (m.kind === 'audio' && src) return <audio key={i} src={src} controls />
        return (
          <a
            key={i}
            href={src ?? undefined}
            download={m.filename || true}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-border bg-inset px-3 py-2 text-[12px] text-muted hover:text-fg"
          >
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{m.filename || m.mime_type || 'file'}</span>
          </a>
        )
      })}
    </div>
  )
}
