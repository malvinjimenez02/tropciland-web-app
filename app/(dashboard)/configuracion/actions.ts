'use server'

import {
  toggleCourierActive,
  createCourier,
  saveMonthlyAds,
} from '@/lib/supabase/queries'

export async function toggleCourierActiveAction(id: string, active: boolean): Promise<void> {
  await toggleCourierActive(id, active)
}

export async function createCourierAction(data: {
  name: string
  type: 'mensajero_sd' | 'transportadora'
}): Promise<void> {
  await createCourier(data)
}

export async function saveMonthlyAdsAction(data: {
  month: string
  budget_usd: number
  exchange_rate: number
  cpa_dop: number
  notes?: string
}): Promise<void> {
  // budget_dop is a generated column in PostgreSQL — never pass it here
  await saveMonthlyAds(data)
}
