'use client'

import { useState } from 'react'
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

// ─── Helpers ───────────────────────────────────────────────

function fmtRD(n: number): string {
  return `RD$${Math.round(n).toLocaleString('es-DO')}`
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('es-DO', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

function exportCSV(orders: OrderWithAds[]) {
  const SEP = ';'
  const headers = ['# Pedido', 'Cliente', 'Transportadora', '# Guía', 'Estado', 'Costo Envío', 'Fecha'].join(SEP)
  const rows = orders.map((o) =>
    [
      o.order_number,
      o.customer_name ?? '',
      o.courier_name ?? 'Sin asignar',
      o.tracking_number ?? '',
      STATUS_META[o.status]?.label ?? o.status,
      Math.round(o.delivery_cost),
      fmtDate(o.created_at),
    ].join(SEP)
  )
  const csv = [headers, ...rows].join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transportadora_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Copy button ────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copiado' : 'Copiar'}
      className="ml-1.5 inline-flex items-center text-gray-400 hover:text-[#1C5E4A] transition-colors"
    >
      {copied ? (
        // Check icon
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        // Clipboard icon
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  )
}

// ─── Empty state ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <svg
        className="w-12 h-12 text-gray-200"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
      <p className="text-sm text-gray-400">No hay pedidos en este período</p>
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────

export default function TransportadoraTab({ orders }: { orders: OrderWithAds[] }) {
  const intOrders = orders.filter((o) => o.zone === 'interior')
  const [filterCourier, setFilterCourier] = useState('__todos__')

  if (intOrders.length === 0) return <EmptyState />

  // Build summary by transportadora
  const summaryMap: Record<string, { enviados: number; entregados: number; totalDelivery: number }> = {}
  for (const o of intOrders) {
    const key = o.courier_name ?? 'Sin asignar'
    if (!summaryMap[key]) summaryMap[key] = { enviados: 0, entregados: 0, totalDelivery: 0 }
    // "enviados" = all non-cancelled statuses (in transit or delivered)
    if (!['cancelado', 'devuelto', 'pendiente', 'en_preparacion', 'empacado'].includes(o.status)) {
      summaryMap[key].enviados++
    }
    if (o.status === 'entregado') {
      summaryMap[key].entregados++
      summaryMap[key].totalDelivery += o.delivery_cost
    }
  }
  const summaryRows = Object.entries(summaryMap).sort(([a], [b]) => a.localeCompare(b))
  const totalEnviados   = summaryRows.reduce((s, [, v]) => s + v.enviados, 0)
  const totalEntregados = summaryRows.reduce((s, [, v]) => s + v.entregados, 0)
  const totalDelivery   = summaryRows.reduce((s, [, v]) => s + v.totalDelivery, 0)

  // Detail filter
  const couriers = [...new Set(intOrders.map((o) => o.courier_name ?? 'Sin asignar'))].sort()
  const detailOrders =
    filterCourier === '__todos__'
      ? intOrders
      : intOrders.filter((o) => (o.courier_name ?? 'Sin asignar') === filterCourier)

  return (
    <div className="space-y-6">
      {/* ── Summary table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Resumen por transportadora</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium">
              {['Transportadora', 'Pedidos enviados', 'Pedidos entregados', 'Total a pagar'].map((h) => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaryRows.map(([name, row]) => (
              <tr key={name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{name}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">{row.enviados}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">{row.entregados}</td>
                <td className="px-4 py-3 tabular-nums text-gray-900 font-medium">
                  {fmtRD(row.totalDelivery)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
              <td className="px-4 py-3 text-gray-500">Total</td>
              <td className="px-4 py-3 tabular-nums text-gray-900">{totalEnviados}</td>
              <td className="px-4 py-3 tabular-nums text-gray-900">{totalEntregados}</td>
              <td className="px-4 py-3 tabular-nums text-gray-900">{fmtRD(totalDelivery)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Detail header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Detalle de pedidos interior{' '}
            <span className="text-gray-400 font-normal">({detailOrders.length})</span>
          </h2>
          <select
            value={filterCourier}
            onChange={(e) => setFilterCourier(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          >
            <option value="__todos__">Todas las transportadoras</option>
            {couriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => exportCSV(detailOrders)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#1C5E4A] border border-[#A7C4BA] rounded-lg hover:bg-[#E6F2EE] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                {['# Pedido', 'Cliente', 'Transportadora', '# Guía', 'Estado', 'Costo envío', 'Fecha'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detailOrders.map((o) => {
                const meta = STATUS_META[o.status]
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{o.order_number}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-[140px] truncate">{o.customer_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.courier_name ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3">
                      {o.tracking_number ? (
                        <span className="flex items-center font-mono text-xs text-gray-700">
                          {o.tracking_number}
                          <CopyButton text={o.tracking_number} />
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: meta?.bg, color: meta?.color }}
                      >
                        {meta?.label ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-900">{fmtRD(o.delivery_cost)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(o.created_at)}</td>
                  </tr>
                )
              })}
              {detailOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                    No hay pedidos para esta transportadora.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
