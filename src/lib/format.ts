// Formatting helpers. AgentOS timestamps come as ISO strings or unix seconds.

function toDate(v?: string | number | null): Date | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v === 'number') {
    // seconds vs milliseconds
    return new Date(v < 1e12 ? v * 1000 : v)
  }
  const n = Number(v)
  if (!Number.isNaN(n) && /^\d+$/.test(v.trim())) {
    return new Date(n < 1e12 ? n * 1000 : n)
  }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDateTime(v?: string | number | null): string {
  const d = toDate(v)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function relativeTime(v?: string | number | null): string {
  const d = toDate(v)
  if (!d) return '—'
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000]
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return '—'
}

export function formatNumber(n?: number | null): string {
  if (n === undefined || n === null) return '0'
  return new Intl.NumberFormat().format(n)
}

export function formatCompact(n?: number | null): string {
  if (n === undefined || n === null) return '0'
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(n)
}

export function formatDuration(v?: string | number | null): string {
  if (v === undefined || v === null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return String(v)
  if (n < 1) return `${Math.round(n * 1000)}ms`
  if (n < 60) return `${n.toFixed(2)}s`
  const m = Math.floor(n / 60)
  return `${m}m ${Math.round(n % 60)}s`
}
