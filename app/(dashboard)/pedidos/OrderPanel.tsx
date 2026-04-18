'use client'

import { useState, useEffect } from 'react'
import type { Courier, OrderStatus, OrderSummary } from '@/lib/types'
import {
  getCouriersAction,
  getAdsCostForMonthAction,
  saveOrderDetailsAction,
  saveOrderCostsAction,
} from './actions'

// ─── Constants ─────────────────────────────────────────────────

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pendiente',      label: 'Pendiente',      color: '#6B7280' },
  { value: 'en_preparacion', label: 'En preparación', color: '#D97706' },
  { value: 'empacado',       label: 'Empacado',       color: '#2563EB' },
  { value: 'en_camino',      label: 'En camino',      color: '#4338CA' },
  { value: 'entregado',      label: 'Entregado',      color: '#16A34A' },
  { value: 'problema',       label: 'Problema',       color: '#DC2626' },
  { value: 'cancelado',      label: 'Cancelado',      color: '#DC2626' },
  { value: 'devuelto',       label: 'Devuelto',       color: '#DC2626' },
]

const STATUS_COLOR = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.color])
) as Record<OrderStatus, string>

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`
}

function fmtRD(n: number): string {
  return `RD$${Math.round(n).toLocaleString('es-DO')}`
}

// ─── Small components ──────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {children}
    </h3>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-gray-600">{children}</label>
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group cursor-help inline-flex">
      <span className="text-gray-400 hover:text-gray-600 text-xs select-none">ⓘ</span>
      <span className="absolute bottom-full left-0 mb-2 w-60 text-xs bg-gray-800 text-white rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 leading-relaxed whitespace-normal shadow-lg">
        {text}
      </span>
    </span>
  )
}

function CostInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-600 flex-1">{label}</span>
      <input
        type="number"
        min={0}
        value={value === 0 ? '' : value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className="w-28 text-sm text-right border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
      />
    </div>
  )
}

function SummaryRow({
  label,
  value,
  className = 'text-gray-900 font-medium',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${className}`}>{value}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Types ─────────────────────────────────────────────────────

type AdsData = {
  adsCostPerOrder: number
  budgetDop: number
  orderCount: number
  isConfigured: boolean
}

type Props = {
  order: OrderSummary | null
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
}

// ─── Main component ────────────────────────────────────────────

export default function OrderPanel({ order, onClose, onStatusChange }: Props) {
  const isOpen = order !== null

  // Form state
  const [status, setStatus] = useState<OrderStatus>('pendiente')
  const [tracking, setTracking] = useState('')
  const [courierName, setCourierName] = useState('')
  const [notes, setNotes] = useState('')
  const [productCost, setProductCost] = useState(0)
  const [packagingCost, setPackagingCost] = useState(0)
  const [deliveryCost, setDeliveryCost] = useState(0)

  // Loaded async data
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [adsData, setAdsData] = useState<AdsData | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Initialize form when selected order changes
  useEffect(() => {
    if (!order) return

    setStatus(order.status)
    setTracking(order.tracking_number ?? '')
    setCourierName(order.courier_name ?? '')
    setNotes(order.notes ?? '')
    setProductCost(order.product_cost ?? 0)
    setPackagingCost(order.packaging_cost ?? 0)
    setDeliveryCost(order.delivery_cost ?? 0)
    setIsDirty(false)
    setSavedOk(false)
    setAdsData(null)

    getCouriersAction().then(setCouriers).catch(() => {})

    const month = order.created_at.slice(0, 7)
    getAdsCostForMonthAction(month).then(setAdsData).catch(() => {})
  }, [order?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCouriers = couriers.filter((c) =>
    order?.zone === 'interior' ? c.type === 'transportadora' : c.type === 'mensajero_sd'
  ).filter((c) => c.active)

  function markDirty() {
    setIsDirty(true)
    setSavedOk(false)
  }

  function handleStatusChange(newStatus: OrderStatus) {
    setStatus(newStatus)
    markDirty()
    if (order) onStatusChange(order.id, newStatus)
  }

  async function handleSave() {
    if (!order) return
    setSaving(true)
    try {
      await Promise.all([
        saveOrderDetailsAction(order.id, {
          status,
          tracking_number: tracking || undefined,
          courier_name: courierName || undefined,
          notes: notes || undefined,
        }),
        saveOrderCostsAction(order.id, {
          product_cost: productCost,
          packaging_cost: packagingCost,
          delivery_cost: deliveryCost,
        }),
      ])
      setIsDirty(false)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 1500)
    } catch {
      // TODO: show error toast
    } finally {
      setSaving(false)
    }
  }

  // Derived calculations
  const adsCost = adsData?.adsCostPerOrder ?? 0
  const totalCosts = productCost + packagingCost + deliveryCost + adsCost
  const shopifyTotal = order?.shopify_total ?? 0
  const netProfit = shopifyTotal - totalCosts
  const margin = shopifyTotal > 0
    ? ((netProfit / shopifyTotal) * 100).toFixed(1)
    : '0.0'

  const isSD = order?.zone === 'santo_domingo'
  const dotColor = STATUS_COLOR[status] ?? '#6B7280'
  const profitClass = netProfit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-[250ms] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[360px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-[250ms] ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {order && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-mono">#{order.order_number}</p>
                <p className="font-semibold text-gray-900 truncate leading-tight">
                  {order.customer_name ?? '—'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 mt-0.5 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Section 1: Información del pedido */}
              <div className="bg-gray-50 px-5 py-4 space-y-3 border-b border-gray-100">
                <InfoRow label="Cliente">{order.customer_name ?? '—'}</InfoRow>
                <InfoRow label="Teléfono">{order.customer_phone ?? '—'}</InfoRow>
                <InfoRow label="Dirección">
                  <span className="leading-snug">{order.customer_address ?? '—'}</span>
                </InfoRow>
                <div className="flex items-start justify-between gap-4">
                  <InfoRow label="Zona">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        isSD ? 'bg-blue-100 text-blue-700' : 'bg-[#E6F2EE] text-[#1C5E4A]'
                      }`}
                    >
                      {isSD ? 'Santo Domingo' : 'Interior'}
                    </span>
                  </InfoRow>
                  <InfoRow label="Total Shopify">
                    <span className="text-green-600 font-semibold">{fmtRD(shopifyTotal)}</span>
                  </InfoRow>
                </div>
                <InfoRow label="Fecha del pedido">{formatDate(order.created_at)}</InfoRow>
              </div>

              {/* Section 2: Estado y entrega */}
              <div className="px-5 py-4 space-y-4 border-b border-gray-100">
                <SectionTitle>Estado y entrega</SectionTitle>

                {/* Status select */}
                <div className="space-y-1.5">
                  <FieldLabel>Estado</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors"
                      style={{ backgroundColor: dotColor }}
                    />
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tracking number — Interior only */}
                {order.zone === 'interior' && (
                  <div className="space-y-1.5">
                    <FieldLabel>Número de guía</FieldLabel>
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => { setTracking(e.target.value); markDirty() }}
                      placeholder="Ej. 123456789"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                    />
                  </div>
                )}

                {/* Courier select */}
                <div className="space-y-1.5">
                  <FieldLabel>{isSD ? 'Mensajero' : 'Transportadora'}</FieldLabel>
                  <select
                    value={courierName}
                    onChange={(e) => { setCourierName(e.target.value); markDirty() }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                  >
                    <option value="">Sin asignar</option>
                    {filteredCouriers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <FieldLabel>Notas</FieldLabel>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); markDirty() }}
                    placeholder="Notas internas..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                  />
                </div>
              </div>

              {/* Section 3: Costos */}
              <div className="px-5 py-4 space-y-4">
                <SectionTitle>Costos (RD$)</SectionTitle>

                <div className="space-y-3">
                  <CostInput
                    label="Costo del producto"
                    value={productCost}
                    onChange={(v) => { setProductCost(v); markDirty() }}
                  />
                  <CostInput
                    label="Logística / empaque"
                    value={packagingCost}
                    onChange={(v) => { setPackagingCost(v); markDirty() }}
                  />
                  <CostInput
                    label="Delivery o transportadora"
                    value={deliveryCost}
                    onChange={(v) => { setDeliveryCost(v); markDirty() }}
                  />

                  {/* Publicidad del mes — read-only */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-600">Publicidad del mes</span>
                      {adsData && (
                        <Tooltip
                          text={
                            adsData.isConfigured
                              ? `CPA configurado manualmente desde Facebook Ads para este mes.`
                              : 'No hay CPA configurado para este mes. Ve a Configuración → Publicidad.'
                          }
                        />
                      )}
                    </div>
                    <span className="text-sm">
                      {!adsData ? (
                        <span className="text-gray-400">—</span>
                      ) : adsData.isConfigured ? (
                        <span className="text-gray-900">{fmtRD(adsData.adsCostPerOrder)}</span>
                      ) : (
                        <span className="text-gray-400">
                          RD$0 —{' '}
                          <a
                            href="/configuracion"
                            className="underline" style={{ color: '#1C5E4A' }}
                          >
                            Sin configurar
                          </a>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Resumen calculado */}
                <div className="space-y-2">
                  <SummaryRow label="Total costos" value={fmtRD(totalCosts)} />
                  <SummaryRow
                    label="Ganancia neta"
                    value={fmtRD(netProfit)}
                    className={profitClass}
                  />
                  <SummaryRow
                    label="Margen"
                    value={`${margin}%`}
                    className={profitClass}
                  />
                </div>
              </div>
            </div>

            {/* ── Footer: save button ── */}
            <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="relative">
                {isDirty && !saving && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full z-10" />
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: '#1C5E4A' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#174d3c')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1C5E4A')}
                >
                  {saving ? (
                    <>
                      <Spinner />
                      Guardando…
                    </>
                  ) : savedOk ? (
                    '✓ Guardado'
                  ) : (
                    'Guardar cambios'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
