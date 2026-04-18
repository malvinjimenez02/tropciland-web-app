'use server'

import {
  updateOrderStatus,
  saveOrderDetails,
  saveOrderCosts,
  getCouriers,
  getAdsCostForMonth,
} from '@/lib/supabase/queries'
import type { Courier, OrderStatus } from '@/lib/types'

export async function updateOrderStatusAction(id: string, status: OrderStatus): Promise<void> {
  await updateOrderStatus(id, status)
}

export async function saveOrderDetailsAction(
  id: string,
  data: {
    status?: OrderStatus
    tracking_number?: string
    courier_name?: string
    notes?: string
  }
): Promise<void> {
  await saveOrderDetails(id, data)
}

export async function saveOrderCostsAction(
  orderId: string,
  costs: {
    product_cost: number
    packaging_cost: number
    delivery_cost: number
  }
): Promise<void> {
  await saveOrderCosts(orderId, costs)
}

export async function getCouriersAction(): Promise<Courier[]> {
  return getCouriers()
}

export async function getAdsCostForMonthAction(month: string): Promise<{
  adsCostPerOrder: number
  budgetDop: number
  orderCount: number
  isConfigured: boolean
}> {
  return getAdsCostForMonth(month)
}
