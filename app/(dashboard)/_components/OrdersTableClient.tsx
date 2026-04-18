'use client'

import { useState } from 'react'
import type { OrderStatus, OrderSummary } from '@/lib/types'
import OrderPanel from '../pedidos/OrderPanel'

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

const ZONE_LABELS: Record<string, { short: string; full: string; color: string; bg: string }> = {
  santo_domingo: { short: 'SD',       full: 'Santo Domingo', color: '#1d4ed8', bg: '#DBEAFE' },
  interior:      { short: 'Interior', full: 'Interior',      color: '#6d28d9', bg: '#EDE9FE' },
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

interface Props {
  orders: OrderSummary[]
  /** When set, used to compute net profit per order (gross_profit - adsCostPerOrder) */
  adsCostPerOrder?: number
  /** Compact mode: hide date column, used in dashboard */
  compact?: boolean
}

export default function OrdersTableClient({ orders, adsCostPerOrder = 0, compact = false }: Props) {
  const [selected,    setSelected]    = useState<OrderSummary | null>(null)
  const [localOrders, setLocalOrders] = useState(orders)

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setLocalOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)))
    setSelected(prev => (prev?.id === orderId ? { ...prev, status: newStatus } : prev))
  }

  const headers = compact
    ? ['#', 'Cliente', 'Zona', 'Estado', 'Total', 'Ganancia']
    : ['# Pedido', 'Cliente', 'Zona', 'Estado', 'Total', 'Ganancia*', 'Fecha']

  return (
    <>
      <div className={compact ? '' : 'rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden'}>
        {!compact && (
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Últimos pedidos</h2>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {headers.map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localOrders.map((order) => {
                const meta   = STATUS_META[order.status]
                const zone   = ZONE_LABELS[order.zone ?? '']
                const hasCost = order.total_cost_base > 0
                const netProfit = order.gross_profit - adsCostPerOrder

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      #{order.order_number}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 font-medium text-gray-900">
                      {order.customer_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {zone ? (
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: zone.bg, color: zone.color }}
                        >
                          {compact ? zone.short : zone.full}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: meta?.bg, color: meta?.color }}
                      >
                        {meta?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">
                      RD${Math.round(order.shopify_total).toLocaleString('es-DO')}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {order.status !== 'entregado' ? (
                        <span className="text-gray-300">—</span>
                      ) : !hasCost ? (
                        <span className="text-amber-600">Sin costo</span>
                      ) : (
                        <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-500'}>
                          RD${Math.round(netProfit).toLocaleString('es-DO')}
                        </span>
                      )}
                    </td>
                    {!compact && (
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                        {fmtDate(order.created_at)}
                      </td>
                    )}
                  </tr>
                )
              })}
              {localOrders.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-gray-400">
                    No hay pedidos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!compact && (
          <div className="border-t border-gray-50 px-5 py-2.5">
            <p className="text-xs text-gray-400">* Ganancia sin descontar publicidad</p>
          </div>
        )}
      </div>

      <OrderPanel
        order={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
