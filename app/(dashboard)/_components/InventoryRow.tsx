import type { Product } from '@/lib/types'

type Props = {
  products: Product[]
  totalDelivered: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 }).format(n)

export default function InventoryRow({ products, totalDelivered }: Props) {
  if (products.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Inventario</h2>
        <span className="text-xs text-gray-400">{totalDelivered} unidades entregadas (total)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => {
          const sold = totalDelivered
          const remaining = Math.max(0, p.initial_stock - sold)
          const pct = p.initial_stock > 0 ? (remaining / p.initial_stock) * 100 : 0
          const color =
            pct > 50 ? { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' }
            : pct > 25 ? { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' }
            : { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }

          return (
            <div key={p.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 leading-tight">{p.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${color.text} ${color.bg}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              <div>
                <span className={`text-3xl font-bold tabular-nums ${color.text}`}>
                  {remaining.toLocaleString('es-DO')}
                </span>
                <span className="text-xs text-gray-400 ml-1">restantes</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${color.bar}`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>{sold.toLocaleString('es-DO')} vendidos</span>
                <span>de {p.initial_stock.toLocaleString('es-DO')}</span>
              </div>

              <div className="text-xs text-gray-500 pt-0.5 border-t border-gray-50">
                Precio unit.: <span className="font-medium text-gray-700">{fmt(p.unit_price)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
