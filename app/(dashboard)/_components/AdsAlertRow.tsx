import Link from 'next/link'

export default function AdsAlertRow({ count }: { count?: number }) {
  // Legacy: no count means unconfigured ads budget
  if (count === undefined) return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
      <span>
        ⚠ <strong>{count} {count === 1 ? 'pedido' : 'pedidos'}</strong> del período sin costos registrados — tu margen está subestimado
      </span>
      <Link
        href="/pedidos"
        className="shrink-0 font-semibold text-amber-900 hover:underline"
      >
        Revisar →
      </Link>
    </div>
  )
}
