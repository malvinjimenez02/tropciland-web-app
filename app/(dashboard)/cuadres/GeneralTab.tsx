'use client'

import type { OrderWithAds } from './page'
import type { OrderStatus } from '@/lib/types'

// ─── Constants ─────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pendiente:      { label: 'Pendiente',      color: '#6B7280', bg: '#F3F4F6' },
  en_preparacion: { label: 'En preparación', color: '#D97706', bg: '#FEF3C7' },
  empacado:       { label: 'Empacado',       color: '#2563EB', bg: '#DBEAFE' },
  en_camino:      { label: 'En camino',      color: '#4338CA', bg: '#E0E7FF' },
  entregado:      { label: 'Entregado',      color: '#16A34A', bg: '#DCFCE7' },
  cancelado:      { label: 'Cancelado',      color: '#DC2626', bg: '#FEE2E2' },
  devuelto:       { label: 'Devuelto',       color: '#DC2626', bg: '#FEE2E2' },
  problema:       { label: 'Problema',       color: '#DC2626', bg: '#FEE2E2' },
}

const ZONE_LABELS: Record<string, string> = {
  santo_domingo: 'Santo Domingo',
  interior: 'Interior',
}

// ─── Helpers ───────────────────────────────────────────────

function fmtRD(n: number): string {
  return `RD$${Math.round(n).toLocaleString('es-DO')}`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function netProfit(o: OrderWithAds): number {
  return o.shopify_total - o.product_cost - o.packaging_cost - o.delivery_cost - o.adsCost
}

// ─── CSV export ────────────────────────────────────────────

function exportCSV(orders: OrderWithAds[]) {
  const SEP = ';'
  const headers = [
    '# Pedido', 'Cliente', 'Zona', 'Estado',
    'Vendido', 'Costo Producto', 'Costo Logística', 'Delivery', 'Ads', 'Ganancia',
    'Fecha',
  ].join(SEP)

  const rows = orders.map((o) =>
    [
      o.order_number,
      o.customer_name ?? '',
      ZONE_LABELS[o.zone ?? ''] ?? '',
      STATUS_META[o.status]?.label ?? o.status,
      Math.round(o.shopify_total),
      Math.round(o.product_cost),
      Math.round(o.packaging_cost),
      Math.round(o.delivery_cost),
      Math.round(o.adsCost),
      Math.round(netProfit(o)),
      fmtDate(o.created_at),
    ].join(SEP)
  )

  const csv = [headers, ...rows].join('\r\n')
  // BOM for Excel UTF-8
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cuadre_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Component ─────────────────────────────────────────────

export default function GeneralTab({ orders }: { orders: OrderWithAds[] }) {
  const delivered = orders.filter((o) => o.status === 'entregado')
  const problematic = orders.filter((o) =>
    ['problema', 'cancelado', 'devuelto'].includes(o.status)
  )

  // Metrics — delivered orders only
  const totalVendido    = delivered.reduce((s, o) => s + o.shopify_total, 0)
  const costoProd       = delivered.reduce((s, o) => s + o.product_cost, 0)
  const costoLog        = delivered.reduce((s, o) => s + o.packaging_cost, 0)
  const costoDelivery   = delivered.reduce((s, o) => s + o.delivery_cost, 0)
  const costoAds        = delivered.reduce((s, o) => s + o.adsCost, 0)
  const totalCostos     = costoProd + costoLog + costoDelivery + costoAds
  const gananciaBruta   = totalVendido - costoProd - costoLog - costoDelivery
  const gananciaNeta    = totalVendido - totalCostos
  const margenNeto      = totalVendido > 0 ? (gananciaNeta / totalVendido) * 100 : 0

  const metrics: { label: string; value: string; color?: string; note?: string }[] = [
    { label: 'Total vendido',         value: fmtRD(totalVendido) },
    { label: 'Costo productos',       value: fmtRD(costoProd) },
    { label: 'Costo logística',       value: fmtRD(costoLog) },
    { label: 'Costo delivery',        value: fmtRD(costoDelivery) },
    { label: 'Costo publicidad',      value: fmtRD(costoAds) },
    { label: 'Total costos',          value: fmtRD(totalCostos) },
    {
      label: 'Ganancia bruta',
      value: fmtRD(gananciaBruta),
      color: gananciaBruta >= 0 ? '#16A34A' : '#DC2626',
      note: 'Sin publicidad',
    },
    {
      label: 'Ganancia neta',
      value: fmtRD(gananciaNeta),
      color: gananciaNeta >= 0 ? '#16A34A' : '#DC2626',
    },
    {
      label: 'Margen neto',
      value: `${margenNeto.toFixed(1)}%`,
      color: margenNeto >= 0 ? '#16A34A' : '#DC2626',
    },
    { label: 'Pedidos entregados',                  value: String(delivered.length) },
    { label: 'Problema / Cancelado / Devuelto',     value: String(problematic.length) },
  ]

  // Table column totals (all orders in period)
  const tVendido  = orders.reduce((s, o) => s + o.shopify_total, 0)
  const tProd     = orders.reduce((s, o) => s + o.product_cost, 0)
  const tLog      = orders.reduce((s, o) => s + o.packaging_cost, 0)
  const tDelivery = orders.reduce((s, o) => s + o.delivery_cost, 0)
  const tAds      = orders.reduce((s, o) => s + o.adsCost, 0)
  const tGanancia = orders.reduce((s, o) => s + netProfit(o), 0)

  return (
    <div className="space-y-6">
      {/* ── Metrics grid ── */}
      <div>
        <p className="text-xs text-gray-400 mb-3">Métricas basadas en pedidos entregados</p>
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm"
            >
              <p className="text-xs text-gray-400 mb-1">{m.label}</p>
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: m.color ?? '#111827' }}
              >
                {m.value}
              </p>
              {m.note && (
                <p className="text-xs text-gray-400 mt-0.5">{m.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Table header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          Detalle de pedidos{' '}
          <span className="text-gray-400 font-normal">({orders.length})</span>
        </h2>
        <button
          onClick={() => exportCSV(orders)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#1C5E4A] border border-[#A7C4BA] rounded-lg hover:bg-[#E6F2EE] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* ── Detail table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium">
                {[
                  '# Pedido', 'Cliente', 'Zona', 'Estado',
                  'Vendido', 'Costo prod.', 'Logística', 'Delivery', 'Ads', 'Ganancia',
                  'Fecha',
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => {
                const meta    = STATUS_META[o.status]
                const ganancia = netProfit(o)
                return (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                      #{o.order_number}
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-[140px] truncate">
                      {o.customer_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {ZONE_LABELS[o.zone ?? ''] ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: meta?.bg, color: meta?.color }}
                      >
                        {meta?.label ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900 whitespace-nowrap">
                      {fmtRD(o.shopify_total)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                      {fmtRD(o.product_cost)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                      {fmtRD(o.packaging_cost)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                      {fmtRD(o.delivery_cost)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                      {fmtRD(o.adsCost)}
                    </td>
                    <td
                      className={`px-4 py-3 tabular-nums font-medium whitespace-nowrap ${
                        ganancia >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {fmtRD(ganancia)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(o.created_at)}
                    </td>
                  </tr>
                )
              })}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-gray-400">
                    No hay pedidos en este período.
                  </td>
                </tr>
              )}
            </tbody>

            {orders.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                  <td className="px-4 py-3 text-gray-500" colSpan={4}>
                    Total
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-900 whitespace-nowrap">
                    {fmtRD(tVendido)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                    {fmtRD(tProd)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                    {fmtRD(tLog)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                    {fmtRD(tDelivery)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600 whitespace-nowrap">
                    {fmtRD(tAds)}
                  </td>
                  <td
                    className={`px-4 py-3 tabular-nums whitespace-nowrap ${
                      tGanancia >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {fmtRD(tGanancia)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
