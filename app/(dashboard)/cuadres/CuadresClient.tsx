'use client'

import { useState } from 'react'
import type { OrderWithAds, AdsMonthMap, AdsHistoryRow } from './page'
import type { MonthlyAds } from '@/lib/types'
import GeneralTab from './GeneralTab'
import MensajerosTab from './MensajerosTab'
import TransportadoraTab from './TransportadoraTab'
import PublicidadTab from './PublicidadTab'

const TABS = [
  { id: 'general',        label: 'General' },
  { id: 'mensajeros',     label: 'Mensajeros SD' },
  { id: 'transportadora', label: 'Transportadora' },
  { id: 'publicidad',     label: 'Publicidad' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function CuadresClient({
  orders,
  adsMap,
  from,
  to,
  currentMonthAds,
  adsHistory,
}: {
  orders: OrderWithAds[]
  adsMap: AdsMonthMap
  from: string
  to: string
  currentMonthAds: MonthlyAds | null
  adsHistory: AdsHistoryRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>('general')

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar */}
      <div className="px-6 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#1C5E4A] text-[#1C5E4A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general'        && <GeneralTab orders={orders} />}
        {activeTab === 'mensajeros'     && <MensajerosTab orders={orders} />}
        {activeTab === 'transportadora' && <TransportadoraTab orders={orders} />}
        {activeTab === 'publicidad'     && (
          <PublicidadTab currentMonthAds={currentMonthAds} adsHistory={adsHistory} />
        )}
      </div>
    </div>
  )
}
