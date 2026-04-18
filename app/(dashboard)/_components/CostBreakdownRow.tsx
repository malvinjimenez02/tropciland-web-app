const fmt = (n: number) => n.toLocaleString('es-DO', { maximumFractionDigits: 0 })
const pct = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%'

interface Breakdown {
  totalVendido: number
  producto:     number
  logistica:    number
  delivery:     number
  publicidad:   number
  ganancia:     number
}

const SEGMENTS = [
  { key: 'producto',   label: 'Producto',   color: '#FCA5A5', textColor: '#b91c1c' },
  { key: 'logistica',  label: 'Logística',  color: '#FCD34D', textColor: '#92400e' },
  { key: 'delivery',   label: 'Delivery',   color: '#FDBA74', textColor: '#c2410c' },
  { key: 'publicidad', label: 'Ads',        color: '#C4B5FD', textColor: '#5b21b6' },
  { key: 'ganancia',   label: 'Ganancia',   color: '#86EFAC', textColor: '#15803d' },
] as const

export default function CostBreakdownRow({ breakdown }: { breakdown: Breakdown }) {
  const { totalVendido } = breakdown
  const hasData = totalVendido > 0

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">¿A dónde se va cada peso?</h2>
        <span className="text-xs text-gray-400">
          {hasData ? `de RD$${fmt(totalVendido)} vendidos` : 'Sin ventas en este período'}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="mb-5 flex h-9 w-full overflow-hidden rounded-lg">
        {hasData ? SEGMENTS.map(({ key, label, color, textColor }) => {
          const val  = breakdown[key]
          const w    = (val / totalVendido) * 100
          if (w < 0.5) return null
          return (
            <div
              key={key}
              className="relative flex items-center justify-center overflow-hidden text-xs font-medium transition-all"
              style={{ width: `${w}%`, backgroundColor: color, color: textColor }}
              title={`${label}: RD$${fmt(val)} (${pct(val, totalVendido)})`}
            >
              {w > 8 && <span className="truncate px-1">{label}</span>}
            </div>
          )
        }) : (
          <div className="w-full rounded-lg bg-gray-100" />
        )}
      </div>

      {/* Breakdown table */}
      <div className="grid grid-cols-5 gap-4">
        {SEGMENTS.map(({ key, label, textColor }) => {
          const val = breakdown[key]
          return (
            <div key={key}>
              <p className="mb-0.5 text-xs text-gray-400">{label}</p>
              <p className="text-sm font-semibold tabular-nums text-gray-900">
                RD${fmt(val)}
              </p>
              <p className="mt-0.5 text-xs font-medium" style={{ color: textColor }}>
                {pct(val, totalVendido)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
