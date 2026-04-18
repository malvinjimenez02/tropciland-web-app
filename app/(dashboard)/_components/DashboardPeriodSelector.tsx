'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PERIOD_OPTIONS = [
  { value: 'semana',        label: 'Esta semana' },
  { value: 'mes',           label: 'Este mes' },
  { value: 'mes_anterior',  label: 'Mes anterior' },
  { value: 'personalizado', label: 'Rango personalizado' },
] as const

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']

export default function DashboardPeriodSelector({
  period,
  from,
  to,
}: {
  period: string
  from: string
  to: string
}) {
  const router = useRouter()
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo]     = useState(to)

  function navigate(p: PeriodValue, f?: string, t?: string) {
    const qs = new URLSearchParams({ period: p })
    if (p === 'personalizado' && f && t) {
      qs.set('from', f)
      qs.set('to', t)
    }
    router.push(`/?${qs.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Period pill tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm divide-x divide-gray-200">
        {PERIOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() =>
              value === 'personalizado'
                ? navigate('personalizado', customFrom, customTo)
                : navigate(value)
            }
            className={`px-3 py-1.5 transition-colors whitespace-nowrap ${
              period === value
                ? 'bg-[#1C5E4A] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Date pickers for custom range */}
      {period === 'personalizado' && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
          <button
            onClick={() => navigate('personalizado', customFrom, customTo)}
            className="px-3 py-1.5 bg-[#1C5E4A] text-white rounded-lg hover:bg-[#174d3c] transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
