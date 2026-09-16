import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidJson(v: string): boolean {
  if (!v.trim()) return false
  try {
    JSON.parse(v)
    return true
  } catch {
    return false
  }
}

// Streamed run content events. Agents emit "RunContent"; teams emit
// "TeamRunContent". Both carry the text delta in `content`.
export function isContentEvent(event?: unknown): boolean {
  return typeof event === 'string' && event.endsWith('RunContent')
}

// "OpenRouter" + "openai/gpt-5.6-luna" -> "OPENAI/GPT-5.6-LUNA".
// The runtime model id already carries provider/model, so prefer it and fall
// back to the provider name when the id is missing.
export function modelLabel(model?: {
  id?: string
  model?: string
  provider?: string
  name?: string
}): string {
  if (!model) return ''
  const id = model.id ?? model.model
  const label = id ?? model.provider ?? model.name ?? ''
  return label.toUpperCase()
}
