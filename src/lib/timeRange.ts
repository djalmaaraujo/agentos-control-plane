// Shared time-range presets for traces/metrics-style views.
export const TIME_RANGES = [
  { key: 'all', label: 'All time' },
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' }
] as const

export type TimeRangeKey = (typeof TIME_RANGES)[number]['key']

export function rangeParams(key: TimeRangeKey): {
  start_time?: string
  end_time?: string
} {
  if (key === 'all') return {}
  const now = new Date()
  const start = new Date(now)
  if (key === '24h') start.setHours(now.getHours() - 24)
  if (key === '7d') start.setDate(now.getDate() - 7)
  if (key === '30d') start.setDate(now.getDate() - 30)
  return { start_time: start.toISOString(), end_time: now.toISOString() }
}
