'use server'

import {
  toggleCourierActive,
  createCourier,
  updateCourier,
  deleteCourier,
  saveMonthlyAds,
  createProduct,
  updateProduct,
  deleteProduct,
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

export async function updateCourierAction(id: string, data: { name: string; type: 'mensajero_sd' | 'transportadora' }): Promise<void> {
  await updateCourier(id, data)
}

export async function deleteCourierAction(id: string): Promise<void> {
  await deleteCourier(id)
}

export async function createProductAction(data: { name: string; unit_price: number; initial_stock: number }): Promise<void> {
  await createProduct(data)
}

export async function updateProductAction(id: string, data: { name: string; unit_price: number; initial_stock: number }): Promise<void> {
  await updateProduct(id, data)
}

export async function deleteProductAction(id: string): Promise<void> {
  await deleteProduct(id)
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
