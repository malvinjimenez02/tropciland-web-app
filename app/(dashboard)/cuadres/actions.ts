'use server'

import { revalidatePath } from 'next/cache'
import { saveMonthlyAds } from '@/lib/supabase/queries'

export async function savePublicidadAction(data: {
  month: string
  budget_usd: number
  exchange_rate: number
}): Promise<void> {
  await saveMonthlyAds(data)
  revalidatePath('/cuadres')
}
