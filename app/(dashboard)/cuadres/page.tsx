import {
  getOrders,
  getAdsCostForMonth,
  getAllMonthlyAds,
  getMonthlyAds,
} from '@/lib/supabase/queries'
import type { MonthlyAds, OrderSummary } from '@/lib/types'
import PeriodSelector from './PeriodSelector'
import CuadresClient from './CuadresClient'

// ─── Exported types consumed by client components ──────────

export type OrderWithAds = OrderSummary & { adsCost: number }
export type AdsMonthMap  = Record<string, { adsCostPerOrder: number; isConfigured: boolean }>
export type AdsHistoryRow = MonthlyAds & { adsCostPerOrder: number; orderCount: number }

// ─── Date helpers ───────────────────────────────────────────

function parseRange(
  period: string,
  from?: string,
  to?: string
): { from: string; to: string } {
  const now = new Date()

  if (period === 'semana') {
    const day = now.getDay()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((day + 6) % 7))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) }
  }

  if (period === 'mes_anterior') {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const m = now.getMonth() === 0 ? 12 : now.getMonth()
    const lastDay = new Date(y, m, 0).getDate()
    return {
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to:   `${y}-${String(m).padStart(2, '0')}-${lastDay}`,
    }
  }

  if (period === 'personalizado' && from && to) {
    return { from, to }
  }

  // Default: este mes
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` }
}

function monthsInRange(from: string, to: string): string[] {
  const months: string[] = []
  let [y, m] = from.slice(0, 7).split('-').map(Number)
  const [ty, tm] = to.slice(0, 7).split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

// ─── Page ───────────────────────────────────────────────────

export default async function CuadresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params  = await searchParams
  const period  = (params.period as string) ?? 'mes'
  const { from, to } = parseRange(
    period,
    params.from as string | undefined,
    params.to  as string | undefined
  )

  const currentMonth = new Date().toISOString().slice(0, 7)

  // Fetch everything in parallel
  const [allOrders, allAdsHistory, currentMonthAds] = await Promise.all([
    getOrders(),
    getAllMonthlyAds(),
    getMonthlyAds(currentMonth),
  ])

  // Filter orders by period range
  const orders = allOrders.filter((o) => {
    const d = o.created_at.slice(0, 10)
    return d >= from && d <= to
  })

  // Ads per month in the period range
  const months     = monthsInRange(from, to)
  const adsResults = await Promise.all(months.map((mo) => getAdsCostForMonth(mo)))
  const adsMap: AdsMonthMap = {}
  months.forEach((mo, i) => { adsMap[mo] = adsResults[i] })

  // Attach per-order ads cost
  const ordersWithAds: OrderWithAds[] = orders.map((o) => ({
    ...o,
    adsCost: adsMap[o.created_at.slice(0, 7)]?.adsCostPerOrder ?? 0,
  }))

  // Build ads history with cost-per-order from each historical month
  const historyMonths   = allAdsHistory.map((a) => a.month)
  const historyCosts    = await Promise.all(historyMonths.map((mo) => getAdsCostForMonth(mo)))
  const adsHistory: AdsHistoryRow[] = allAdsHistory.map((a, i) => ({
    ...a,
    adsCostPerOrder: historyCosts[i].adsCostPerOrder,
    orderCount:      historyCosts[i].orderCount,
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 flex-shrink-0 flex items-center justify-between gap-4 flex-wrap border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Cuadres</h1>
        <PeriodSelector period={period} from={from} to={to} />
      </div>

      <CuadresClient
        orders={ordersWithAds}
        adsMap={adsMap}
        from={from}
        to={to}
        currentMonthAds={currentMonthAds}
        adsHistory={adsHistory}
      />
    </div>
  )
}
