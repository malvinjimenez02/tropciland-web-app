'use server'

import {
  updateOrderStatus,
  saveOrderDetails,
  saveOrderCosts,
  getOrderCostsExtra,
  getCouriers,
  getAdsCostForMonth,
  getProducts,
} from '@/lib/supabase/queries'
import type { Courier, OrderStatus, Product } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

function extractAddress(addr: Record<string, string> | undefined): string | null {
  if (!addr) return null
  const parts = [addr.address1, addr.city, addr.province].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

function detectZone(shippingAddress: Record<string, string> | undefined): string | null {
  if (!shippingAddress) return null
  const city = (shippingAddress.city ?? '').toLowerCase()
  const province = (shippingAddress.province ?? '').toLowerCase()
  const combined = `${city} ${province}`
  const sdKeywords = ['santo domingo', 'distrito nacional', 'd.n.', 'sto. dgo', 'sto dgo']
  return sdKeywords.some((kw) => combined.includes(kw)) ? 'santo_domingo' : 'interior'
}


export type CsvOrderRow = {
  shopify_id: string
  order_number: string
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_province: string | null
  shopify_total: number
  zone: string | null
}

export async function importOrdersFromCsvAction(rows: CsvOrderRow[]): Promise<{ imported: number; error?: string }> {
  if (!rows.length) return { imported: 0 }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: existing } = await supabase.from('orders').select('shopify_id')
  const existingIds = new Set((existing ?? []).map((o: { shopify_id: string }) => o.shopify_id))

  let imported = 0
  for (const row of rows) {
    if (existingIds.has(row.shopify_id)) continue

    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        shopify_id: row.shopify_id,
        order_number: row.order_number,
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_address: row.customer_address,
        customer_province: row.customer_province,
        shopify_total: row.shopify_total,
        zone: row.zone,
        shopify_data: row,
      })
      .select('id')
      .single()

    if (!insertError && newOrder) {
      await supabase.from('order_costs').insert({ order_id: newOrder.id })
      imported++
    }
  }

  return { imported }
}

export async function deleteOrderAction(id: string): Promise<{ error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await supabase.from('order_costs').delete().eq('order_id', id)
  const { error } = await supabase.from('orders').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

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
    quantity: number
    discount: number
  }
): Promise<void> {
  await saveOrderCosts(orderId, costs)
}

export async function getOrderCostsExtraAction(orderId: string): Promise<{
  quantity: number
  discount: number
  product_cost: number
  packaging_cost: number
  delivery_cost: number
}> {
  return getOrderCostsExtra(orderId)
}

export async function getProductsAction(): Promise<Product[]> {
  return getProducts()
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
