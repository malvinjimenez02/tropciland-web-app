'use client'

import { useState } from 'react'
import type { AdsHistoryRow } from './page'
import type { MonthlyAds } from '@/lib/types'
import { savePublicidadAction } from './actions'

// ─── Helpers ───────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fmtMonth(m: string): string {
  const [y, mo] = m.split('-')
  return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}`
}

function fmtRD(n: number): string {
  return `RD$${Math.round(n).toLocaleString('es-DO')}`
}

// ─── Form ──────────────────────────────────────────────────

function AdsForm({
  currentMonth,
  initial,
}: {
  currentMonth: string
  initial: MonthlyAds | null
}) {
  const [budgetUsd, setBudgetUsd]     = useState<string>(initial?.budget_usd?.toString() ?? '')
  const [exchangeRate, setExchangeRate] = useState<string>(initial?.exchange_rate?.toString() ?? '')
  const [saving, setSaving]           = useState(false)
  const [savedOk, setSavedOk]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const usd  = parseFloat(budgetUsd) || 0
  const rate = parseFloat(exchangeRate) || 0
  const totalRD = usd * rate

  async function handleSave() {
    if (usd <= 0 || rate <= 0) {
      setError('Ingresa valores válidos para USD y tasa de cambio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await savePublicidadAction({ month: currentMonth, budget_usd: usd, exchange_rate: rate, cpa_dop: 0 })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-w-sm">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Presupuesto — {fmtMonth(currentMonth)}
      </h2>

      <div className="space-y-4">
        {/* Budget USD */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Presupuesto en USD</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1C5E4A]">
            <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 py-2">$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={budgetUsd}
              onChange={(e) => { setBudgetUsd(e.target.value); setSavedOk(false) }}
              placeholder="0.00"
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Exchange rate */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Tasa de cambio RD$/USD</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1C5E4A]">
            <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 py-2">×</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={exchangeRate}
              onChange={(e) => { setExchangeRate(e.target.value); setSavedOk(false) }}
              placeholder="0.00"
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Total RD$ — read-only, calculated live */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Total RD$ (calculado)</label>
          <div className="flex items-center border border-gray-100 rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {fmtRD(totalRD)}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-colors" style={{ backgroundColor: '#1C5E4A' }}
        >
          {saving ? 'Guardando…' : savedOk ? '✓ Guardado' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── History table ──────────────────────────────────────────

function AdsHistory({ history }: { history: AdsHistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6">No hay historial de publicidad aún.</p>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">Historial</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium">
              {['Mes', 'USD', 'Tasa', 'RD$', 'Pedidos del mes', 'Costo por pedido'].map((h) => (
                <th key={h} className="text-left px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{fmtMonth(row.month)}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  ${row.budget_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {row.exchange_rate.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-900">{fmtRD(row.budget_dop)}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">{row.orderCount}</td>
                <td className="px-4 py-3 tabular-nums text-gray-900">
                  {row.orderCount > 0 ? fmtRD(row.adsCostPerOrder) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────

export default function PublicidadTab({
  currentMonthAds,
  adsHistory,
}: {
  currentMonthAds: MonthlyAds | null
  adsHistory: AdsHistoryRow[]
}) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="space-y-6">
      <AdsForm currentMonth={currentMonth} initial={currentMonthAds} />
      <AdsHistory history={adsHistory} />
    </div>
  )
}
