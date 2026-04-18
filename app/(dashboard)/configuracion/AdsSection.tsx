'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { MonthlyAds } from '@/lib/types'
import { saveMonthlyAdsAction } from './actions'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatMonth(m: string): string {
  const [year, month] = m.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

function fmtRD(n: number): string {
  return `RD$${Math.round(n).toLocaleString('es-DO')}`
}

function fmtUSD(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

type AdsWithCost = MonthlyAds & { adsCostPerOrder: number; orderCount: number }

type Props = {
  initialAds: AdsWithCost[]
  currentMonth: string
}

export default function AdsSection({ initialAds, currentMonth }: Props) {
  const router = useRouter()

  // Pre-fill form if current month already has data
  const existing = initialAds.find((a) => a.month === currentMonth)

  const [budgetUsd, setBudgetUsd] = useState(existing?.budget_usd ?? 0)
  const [exchangeRate, setExchangeRate] = useState(existing?.exchange_rate ?? 0)
  const [cpaDop, setCpaDop] = useState(existing?.cpa_dop ?? 0)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Sync if server re-renders with fresh data
  useEffect(() => {
    const fresh = initialAds.find((a) => a.month === currentMonth)
    if (fresh) {
      setBudgetUsd(fresh.budget_usd)
      setExchangeRate(fresh.exchange_rate)
      setCpaDop(fresh.cpa_dop)
    }
  }, [initialAds, currentMonth])

  // Real-time total (JS calculation — display only, BD computes the real value)
  const previewRD = budgetUsd * exchangeRate

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveMonthlyAdsAction({
        month: currentMonth,
        budget_usd: budgetUsd,
        exchange_rate: exchangeRate,
        cpa_dop: cpaDop,
      })
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 1500)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Publicidad mensual</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Presupuesto de Meta/Google prorrateado por pedido activo
        </p>
      </div>

      {/* History table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-2.5 text-xs font-medium text-gray-500">Mes</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">USD</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">Tasa</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">Total RD$</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-right">CPA (RD$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {initialAds.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-400">
                  Sin registros de publicidad aún.
                </td>
              </tr>
            ) : (
              initialAds.map((ad) => (
                <tr
                  key={ad.month}
                  className={`hover:bg-gray-50 transition-colors ${
                    ad.month === currentMonth ? 'bg-[#E6F2EE]/50' : ''
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {formatMonth(ad.month)}
                    {ad.month === currentMonth && (
                      <span className="ml-2 text-xs text-[#1C5E4A] font-normal">actual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {fmtUSD(ad.budget_usd)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {ad.exchange_rate.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {fmtRD(ad.budget_dop)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ad.cpa_dop > 0 ? (
                      <span className="text-gray-900 font-medium">{fmtRD(ad.cpa_dop)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form for current month */}
      <form onSubmit={handleSave} className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {formatMonth(currentMonth)}
          </p>
          {existing && (
            <span className="text-xs text-[#1C5E4A]">Editando mes actual</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Presupuesto USD</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={budgetUsd === 0 ? '' : budgetUsd}
              onChange={(e) => setBudgetUsd(parseFloat(e.target.value) || 0)}
              placeholder="150.00"
              required
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Tasa RD$/USD</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={exchangeRate === 0 ? '' : exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              placeholder="58.50"
              required
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-600">
            CPA (RD$) —{' '}
            <span className="text-gray-400 font-normal">costo por cliente según Facebook Ads</span>
          </label>
          <input
            type="number"
            min={0}
            step="1"
            value={cpaDop === 0 ? '' : cpaDop}
            onChange={(e) => setCpaDop(parseFloat(e.target.value) || 0)}
            placeholder="175"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
        </div>

        {/* Real-time preview (display only) */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500">Total en RD$ (vista previa)</span>
          <span className="text-sm font-semibold text-gray-900">
            {previewRD > 0 ? fmtRD(previewRD) : '—'}
          </span>
        </div>

        <button
          type="submit"
          disabled={saving || budgetUsd <= 0 || exchangeRate <= 0}
          className="self-end px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2" style={{ backgroundColor: '#1C5E4A' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#174d3c')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1C5E4A')}
        >
          {saving ? (
            <>
              <Spinner />
              Guardando…
            </>
          ) : savedOk ? (
            '✓ Guardado'
          ) : (
            'Guardar presupuesto del mes'
          )}
        </button>
      </form>
    </section>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
