const fmt = (n: number) => n.toLocaleString('es-DO', { maximumFractionDigits: 0 })

interface MetricProp {
  value: number
  delta: number
  sparkline: number[]
}

interface Props {
  vendido:  MetricProp
  ganancia: MetricProp
  margen:   MetricProp
  roas:     MetricProp
}

function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null
  const max = Math.max(...values) || 1
  const min = Math.min(...values)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`)
    .join(' ')
  const color = positive ? '#16a34a' : '#dc2626'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-20" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function DeltaBadge({ delta, suffix = '%', pct = true }: { delta: number; suffix?: string; pct?: boolean }) {
  const isPos = delta >= 0
  const abs   = Math.abs(delta)
  const label = pct ? `${abs.toFixed(1)}${suffix}` : `${abs.toFixed(1)}${suffix}`
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPos ? 'text-green-600' : 'text-red-500'}`}>
      {isPos ? '▲' : '▼'} {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  sparkline,
}: {
  label: string
  value: string
  delta: number
  deltaLabel?: string
  sparkline: number[]
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="mb-1.5 text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <DeltaBadge delta={delta} suffix={deltaLabel ?? '%'} />
        <Sparkline values={sparkline} positive={delta >= 0} />
      </div>
    </div>
  )
}

export default function MetricsRow({ vendido, ganancia, margen, roas }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard
        label="Vendido"
        value={`RD$${fmt(vendido.value)}`}
        delta={vendido.delta}
        sparkline={vendido.sparkline}
      />
      <MetricCard
        label="Ganancia neta"
        value={`RD$${fmt(ganancia.value)}`}
        delta={ganancia.delta}
        sparkline={ganancia.sparkline}
      />
      <MetricCard
        label="Margen neto"
        value={`${margen.value.toFixed(1)}%`}
        delta={margen.delta}
        deltaLabel="pp"
        sparkline={margen.sparkline}
      />
      <MetricCard
        label="ROAS"
        value={`${roas.value.toFixed(1)}x`}
        delta={roas.delta}
        deltaLabel="x"
        sparkline={roas.sparkline}
      />
    </div>
  )
}
