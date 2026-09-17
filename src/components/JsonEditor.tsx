import { useState } from 'react'
import { cn } from '@/lib/utils'

// Controlled JSON textarea with live parse validation. The parent reads `value`
// (raw text) and can check validity by parsing; this surfaces the error inline.
export function JsonEditor({
  value,
  onChange,
  rows = 16
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  const [error, setError] = useState<string | null>(null)

  const validate = (v: string) => {
    if (!v.trim()) {
      setError(null)
      return
    }
    try {
      JSON.parse(v)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <textarea
        value={value}
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value)
          validate(e.target.value)
        }}
        rows={rows}
        className={cn(
          'w-full resize-y rounded-lg border bg-inset p-3 font-mono text-[12px] leading-relaxed text-muted outline-none',
          error ? 'border-red-900/60 focus:border-red-700' : 'border-border focus:border-accent'
        )}
      />
      {error && <p className="mt-1 font-mono text-[11px] text-red-300">{error}</p>}
    </div>
  )
}
