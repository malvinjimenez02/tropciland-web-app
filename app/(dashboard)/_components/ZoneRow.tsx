const fmt    = (n: number) => n.toLocaleString('es-DO', { maximumFractionDigits: 0 })
const fmtPct = (n: number) => `${n.toFixed(1)}%`

interface ZoneData {
  pedidos:    number
  ticketProm: number
  margen:     number
}

interface Props {
  sd:            ZoneData
  interior:      ZoneData
  totalPedidos:  number
}

function ZoneCard({
  name,
  pctVolumen,
  data,
}: {
  name:       string
  pctVolumen: number
  data:       ZoneData
}) {
  return (
    <div className="flex-1 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{name}</h3>
        <span className="text-xs text-gray-400">{fmtPct(pctVolumen)} del volumen</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="mb-1 text-xs text-gray-400">Pedidos</p>
          <p className="text-xl font-bold tabular-nums text-gray-900">{data.pedidos}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-400">Ticket prom.</p>
          <p className="text-xl font-bold tabular-nums text-gray-900">RD${fmt(data.ticketProm)}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-gray-400">Margen</p>
          <p
            className="text-xl font-bold tabular-nums"
            style={{ color: data.margen >= 0 ? '#16a34a' : '#dc2626' }}
          >
            {fmtPct(data.margen)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ZoneRow({ sd, interior, totalPedidos }: Props) {
  const sdPct  = totalPedidos > 0 ? (sd.pedidos / totalPedidos) * 100 : 0
  const intPct = totalPedidos > 0 ? (interior.pedidos / totalPedidos) * 100 : 0

  return (
    <div className="flex gap-4">
      <ZoneCard name="Santo Domingo" pctVolumen={sdPct}  data={sd} />
      <ZoneCard name="Interior"      pctVolumen={intPct} data={interior} />
    </div>
  )
}
