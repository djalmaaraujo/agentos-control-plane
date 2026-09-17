// Client-side download helpers for exporting table data.

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportJson(filename: string, data: unknown) {
  download(`${filename}.json`, JSON.stringify(data, null, 2), 'application/json')
}

function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[]
) {
  if (rows.length === 0) {
    download(`${filename}.csv`, '', 'text/csv')
    return
  }
  const cols = columns ?? Object.keys(rows[0])
  const header = cols.map(toCsvValue).join(',')
  const body = rows.map((r) => cols.map((c) => toCsvValue(r[c])).join(',')).join('\n')
  download(`${filename}.csv`, `${header}\n${body}`, 'text/csv')
}
