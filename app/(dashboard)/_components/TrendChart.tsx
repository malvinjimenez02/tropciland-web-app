export interface DailyPoint {
  date: string
  day: number
  vendido: number
  ganancia: number
}

function niceTicks(max: number, count = 5): number[] {
  if (max === 0) return [0, 2000, 4000, 6000, 8000, 10000]
  const raw  = max / count
  const mag  = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = Math.ceil(raw / mag) * mag
  const ticks: number[] = []
  for (let i = 0; i * step <= max * 1.15; i++) ticks.push(i * step)
  return ticks
}

function polyline(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const parts: string[] = [`M ${pts[0][0]} ${pts[0][1]}`]
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]
    const [cx, cy] = pts[i]
    const dx = (cx - px) * 0.4
    parts.push(`C ${px + dx} ${py} ${cx - dx} ${cy} ${cx} ${cy}`)
  }
  return parts.join(' ')
}

export default function TrendChart({ points }: { points: DailyPoint[] }) {
  const PAD  = { top: 16, right: 24, bottom: 32, left: 64 }
  const VW   = 700
  const VH   = 220
  const cw   = VW - PAD.left - PAD.right
  const ch   = VH - PAD.top  - PAD.bottom

  const maxVal  = Math.max(...points.map(p => p.vendido), 10000)
  const ticks   = niceTicks(maxVal)
  const maxTick = ticks[ticks.length - 1]

  const xOf = (i: number) => PAD.left + (i / (points.length - 1)) * cw
  const yOf = (v: number) => PAD.top  + ch - (v / maxTick) * ch

  const vPts: [number, number][] = points.map((p, i) => [xOf(i), yOf(p.vendido)])
  const gPts: [number, number][] = points.map((p, i) => [xOf(i), yOf(p.ganancia)])

  const vPath = polyline(vPts)
  const aPath = vPath
    + ` L ${xOf(points.length - 1)} ${PAD.top + ch} L ${xOf(0)} ${PAD.top + ch} Z`

  // X labels: every 5 days
  const xLabels = points.filter((_, i) => i % 5 === 0)

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tendencia · últimos 30 días</span>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-6 bg-blue-500 rounded" />
            Vendido
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="24" height="2" viewBox="0 0 24 2">
              <line x1="0" y1="1" x2="24" y2="1" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            Ganancia
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left} x2={VW - PAD.right}
              y1={yOf(tick)} y2={yOf(tick)}
              stroke="#F3F4F6" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={yOf(tick) + 4}
              textAnchor="end" fontSize="10" fill="#9CA3AF"
            >
              {tick >= 1000 ? `RD$${tick / 1000}k` : `RD$${tick}`}
            </text>
          </g>
        ))}

        {/* Area */}
        <path d={aPath} fill="url(#vGrad)" />

        {/* Vendido line */}
        <path d={vPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

        {/* Ganancia dashed line */}
        <path
          d={polyline(gPts)}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />

        {/* X labels */}
        {xLabels.map((p) => {
          const i = points.indexOf(p)
          return (
            <text key={i} x={xOf(i)} y={VH - 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">
              {p.day}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
