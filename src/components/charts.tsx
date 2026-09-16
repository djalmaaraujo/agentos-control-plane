// Minimal inline-SVG charts for the metrics dashboard. Theme-aware via currentColor
// and the accent token; no external chart lib.

const AXIS = '#3a3a40'
const GRID = '#1c1c1f'

function niceMax(v: number) {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

function ticks(days: number): number[] {
  return [1, 8, 15, 22, 29].filter((d) => d <= days)
}

export function LineChart({
  values,
  height = 150
}: {
  values: number[]
  height?: number
}) {
  const w = 600
  const h = height
  const padL = 34
  const padB = 20
  const padT = 8
  const max = niceMax(Math.max(1, ...values))
  const n = values.length
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * (w - padL - 8)
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB)
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" role="img">
      <line x1={padL} y1={h - padB} x2={w - 8} y2={h - padB} stroke={AXIS} strokeWidth="1" />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={padL - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#5c5c63" fontFamily="monospace">
          {Math.round(max * f)}
        </text>
      ))}
      {ticks(n).map((d) => (
        <text key={d} x={x(d - 1)} y={h - 6} textAnchor="middle" fontSize="9" fill="#5c5c63" fontFamily="monospace">
          {d}
        </text>
      ))}
      <path d={path} fill="none" stroke="#ededef" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function BarChart({
  values,
  height = 150
}: {
  values: number[]
  height?: number
}) {
  const w = 600
  const h = height
  const padL = 40
  const padB = 20
  const padT = 8
  const max = niceMax(Math.max(1, ...values))
  const n = values.length
  const slot = (w - padL - 8) / Math.max(1, n)
  const bw = Math.max(2, slot * 0.6)
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" role="img">
      <line x1={padL} y1={h - padB} x2={w - 8} y2={h - padB} stroke={AXIS} strokeWidth="1" />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={padL - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#5c5c63" fontFamily="monospace">
          {max * f >= 1000 ? `${Math.round((max * f) / 1000)}K` : Math.round(max * f)}
        </text>
      ))}
      {ticks(n).map((d) => (
        <text key={d} x={padL + (d - 0.5) * slot} y={h - 6} textAnchor="middle" fontSize="9" fill="#5c5c63" fontFamily="monospace">
          {d}
        </text>
      ))}
      {values.map((v, i) => {
        const bh = v > 0 ? Math.max(1, (v / max) * (h - padT - padB)) : 0
        return (
          <rect
            key={i}
            x={padL + i * slot + (slot - bw) / 2}
            y={h - padB - bh}
            width={bw}
            height={bh}
            rx="1.5"
            fill="#ff5c33"
            opacity="0.85"
          />
        )
      })}
    </svg>
  )
}

const DONUT_COLORS = ['#ff5c33', '#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#6b7280']

export function Donut({
  segments,
  total
}: {
  segments: { label: string; value: number }[]
  total: number
}) {
  const size = 160
  const r = 60
  const cx = size / 2
  const cy = size / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={GRID} strokeWidth="16" />
        {segments.map((s, i) => {
          const frac = s.value / sum
          const dash = frac * c
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return el
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="rotate-90" fontSize="22" fontWeight="600" fill="#ededef" transform={`rotate(90 ${cx} ${cy})`}>
          {total}
        </text>
      </svg>
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="truncate font-mono text-muted" title={s.label}>{s.label}</span>
            <span className="ml-auto font-mono text-faint">
              {Math.round((s.value / sum) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
