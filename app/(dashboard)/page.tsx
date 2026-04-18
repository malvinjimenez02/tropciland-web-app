import { getOrders, getAdsCostForMonth } from '@/lib/supabase/queries'
import type { OrderSummary } from '@/lib/types'
import DashboardPeriodSelector from './_components/DashboardPeriodSelector'
import MetricsRow from './_components/MetricsRow'
import TrendChart from './_components/TrendChart'
import CostBreakdownRow from './_components/CostBreakdownRow'
import ZoneRow from './_components/ZoneRow'
import StatusRow from './_components/StatusRow'
import OrdersTableClient from './_components/OrdersTableClient'
import AdsAlertRow from './_components/AdsAlertRow'

// ─── Period helpers ─────────────────────────────────────────

function parseRange(period: string, paramFrom?: string, paramTo?: string): { from: string; to: string } {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  if (period === 'personalizado' && paramFrom && paramTo) {
    return { from: paramFrom, to: paramTo }
  }

  if (period === 'semana') {
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1 // Mon=0
    const mon = new Date(now)
    mon.setDate(now.getDate() - dow)
    return { from: mon.toISOString().slice(0, 10), to: today }
  }

  if (period === 'mes_anterior') {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const m = now.getMonth() === 0 ? 12 : now.getMonth()
    const lastDay = new Date(y, m, 0).getDate()
    return {
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  // default: mes
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, '0')}` }
}

function parsePrevRange(period: string, from: string, to: string): { from: string; to: string } {
  if (period === 'semana' || period === 'personalizado') {
    // shift back by the same number of days
    const fromD = new Date(from + 'T12:00:00')
    const toD   = new Date(to   + 'T12:00:00')
    const days  = Math.round((toD.getTime() - fromD.getTime()) / 86_400_000) + 1
    const pTo   = new Date(fromD); pTo.setDate(pTo.getDate() - 1)
    const pFrom = new Date(pTo);   pFrom.setDate(pFrom.getDate() - (days - 1))
    return { from: pFrom.toISOString().slice(0, 10), to: pTo.toISOString().slice(0, 10) }
  }
  const fromD = new Date(from + 'T12:00:00')
  fromD.setMonth(fromD.getMonth() - 1)
  const toD = new Date(to + 'T12:00:00')
  toD.setMonth(toD.getMonth() - 1)
  const lastDay = new Date(fromD.getFullYear(), fromD.getMonth() + 1, 0).getDate()
  if (toD.getDate() > lastDay) toD.setDate(lastDay)
  return {
    from: fromD.toISOString().slice(0, 10),
    to: toD.toISOString().slice(0, 10),
  }
}

function periodSubtitle(period: string, from: string, to: string): string {
  if (period === 'semana') return 'Esta semana'
  if (period === 'personalizado') {
    const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
    return `${fmtDate(from)} – ${fmtDate(to)}`
  }
  const d = new Date(from + 'T12:00:00')
  const label = d.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ─── Helpers ────────────────────────────────────────────────

function metrics(delivered: OrderSummary[], adsCostPerOrder: number) {
  const vendido  = delivered.reduce((s, o) => s + o.shopify_total, 0)
  const costBase = delivered.reduce((s, o) => s + o.total_cost_base, 0)
  const ads      = adsCostPerOrder * delivered.length
  const ganancia = vendido - costBase - ads
  const margen   = vendido > 0 ? (ganancia / vendido) * 100 : 0
  const roas     = ads > 0 ? vendido / ads : 0
  return { vendido, costBase, ads, ganancia, margen, roas }
}

function ageDays(dateStr: string)  { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000) }
function ageHours(dateStr: string) { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000) }

// ─── Page ────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params      = await searchParams
  const period      = (params.period as string) ?? 'mes'
  const paramFrom   = params.from as string | undefined
  const paramTo     = params.to   as string | undefined
  const { from, to }           = parseRange(period, paramFrom, paramTo)
  const { from: pf, to: pt }   = parsePrevRange(period, from, to)
  const currentMonth           = new Date().toISOString().slice(0, 7)
  const subtitle               = periodSubtitle(period, from, to)

  const [allOrders, adsData] = await Promise.all([
    getOrders(),
    getAdsCostForMonth(currentMonth),
  ])

  const { adsCostPerOrder } = adsData

  // ── Period slices ──────────────────────────────────────────
  const inPeriod   = allOrders.filter(o => { const d = o.created_at.slice(0, 10); return d >= from && d <= to })
  const delivered  = inPeriod.filter(o => o.status === 'entregado')
  const prevDel    = allOrders.filter(o => { const d = o.created_at.slice(0, 10); return d >= pf && d <= pt && o.status === 'entregado' })

  const curr = metrics(delivered, adsCostPerOrder)
  const prev = metrics(prevDel, adsCostPerOrder)
  const pct  = (a: number, b: number) => b !== 0 ? ((a - b) / Math.abs(b)) * 100 : 0

  // ── Trend data (últimos 30 días, always) ───────────────────
  const d30 = new Date(); d30.setDate(d30.getDate() - 29)
  const d30Str  = d30.toISOString().slice(0, 10)
  const todayStr = new Date().toISOString().slice(0, 10)

  const dailyMap: Record<string, { vendido: number; ganancia: number }> = {}
  for (const o of allOrders.filter(o => {
    const d = o.created_at.slice(0, 10)
    return d >= d30Str && d <= todayStr && o.status === 'entregado'
  })) {
    const day = o.created_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { vendido: 0, ganancia: 0 }
    dailyMap[day].vendido  += o.shopify_total
    dailyMap[day].ganancia += o.shopify_total - o.total_cost_base
  }

  const trendPoints = Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(d30); dt.setDate(d30.getDate() + i)
    const ds = dt.toISOString().slice(0, 10)
    return { date: ds, day: dt.getDate(), vendido: dailyMap[ds]?.vendido ?? 0, ganancia: dailyMap[ds]?.ganancia ?? 0 }
  })

  const spark7 = trendPoints.slice(-7)
  const sparklines = {
    vendido:  spark7.map(p => p.vendido),
    ganancia: spark7.map(p => p.ganancia),
    margen:   spark7.map(p => p.vendido > 0 ? (p.ganancia / p.vendido) * 100 : 0),
    roas:     spark7.map(_ => curr.roas),
  }

  // ── Cost breakdown ─────────────────────────────────────────
  const breakdown = {
    totalVendido: curr.vendido,
    producto:   delivered.reduce((s, o) => s + o.product_cost, 0),
    logistica:  delivered.reduce((s, o) => s + o.packaging_cost, 0),
    delivery:   delivered.reduce((s, o) => s + o.delivery_cost, 0),
    publicidad: curr.ads,
    ganancia:   curr.ganancia,
  }

  // ── Zones ──────────────────────────────────────────────────
  function zoneMetrics(zone: string) {
    const zOrders = delivered.filter(o => o.zone === zone)
    const vendido  = zOrders.reduce((s, o) => s + o.shopify_total, 0)
    const costBase = zOrders.reduce((s, o) => s + o.total_cost_base, 0)
    const ganancia = vendido - costBase - adsCostPerOrder * zOrders.length
    return {
      pedidos:    zOrders.length,
      ticketProm: zOrders.length > 0 ? vendido / zOrders.length : 0,
      margen:     vendido > 0 ? (ganancia / vendido) * 100 : 0,
    }
  }
  const sdZone  = zoneMetrics('santo_domingo')
  const intZone = zoneMetrics('interior')
  const totalPedidos = sdZone.pedidos + intZone.pedidos

  // ── Pipeline ───────────────────────────────────────────────
  const pend    = allOrders.filter(o => o.status === 'pendiente')
  const enPrep  = allOrders.filter(o => o.status === 'en_preparacion')
  const emp     = allOrders.filter(o => o.status === 'empacado')
  const enCam   = allOrders.filter(o => o.status === 'en_camino')
  const entMes  = allOrders.filter(o => o.status === 'entregado' && o.created_at.startsWith(currentMonth))

  const oldestPend = [...pend].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  const oldestPrep = [...enPrep].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  const stuck = enCam.filter(o => ageDays(o.updated_at) >= 5).length

  const pipeline = {
    pendiente:      { count: pend.length,   subtitle: oldestPend ? (ageHours(oldestPend.created_at) < 24 ? `nuevo hace ${ageHours(oldestPend.created_at)}h` : `hace ${ageDays(oldestPend.created_at)}d`) : '' },
    en_preparacion: { count: enPrep.length, subtitle: oldestPrep ? `más viejo: ${ageDays(oldestPrep.created_at)}d` : '' },
    empacado:       { count: emp.length,    subtitle: 'listo p/ envío' },
    en_camino:      { count: enCam.length,  subtitle: stuck > 0 ? `${stuck} sin moverse >5d` : 'en tránsito' },
    entregado:      { count: entMes.length, subtitle: 'este mes' },
  }

  // ── Alert ──────────────────────────────────────────────────
  const withoutCosts = inPeriod.filter(
    o => !['cancelado', 'devuelto'].includes(o.status) && o.total_cost_base === 0
  ).length

  return (
    <div className="px-8 py-7 space-y-5 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>
        </div>
        <DashboardPeriodSelector period={period} from={from} to={to} />
      </div>

      {/* Alert */}
      {withoutCosts > 0 && <AdsAlertRow count={withoutCosts} />}

      {/* Metrics */}
      <MetricsRow
        vendido={{ value: curr.vendido,   delta: pct(curr.vendido,   prev.vendido),   sparkline: sparklines.vendido }}
        ganancia={{ value: curr.ganancia, delta: pct(curr.ganancia,  prev.ganancia),  sparkline: sparklines.ganancia }}
        margen={{ value: curr.margen,     delta: curr.margen - prev.margen,           sparkline: sparklines.margen }}
        roas={{ value: curr.roas,         delta: curr.roas - prev.roas,               sparkline: sparklines.roas }}
      />

      {/* Trend */}
      <TrendChart points={trendPoints} />

      {/* Cost breakdown */}
      <CostBreakdownRow breakdown={breakdown} />

      {/* Zones */}
      <ZoneRow sd={sdZone} interior={intZone} totalPedidos={totalPedidos} />

      {/* Pipeline */}
      <StatusRow pipeline={pipeline} />

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Pedidos recientes</h2>
          <a href="/pedidos" className="text-xs text-[#2d5c3c] font-medium hover:underline">Ver todos →</a>
        </div>
        <OrdersTableClient orders={allOrders.slice(0, 5)} adsCostPerOrder={adsCostPerOrder} compact />
      </div>
    </div>
  )
}
