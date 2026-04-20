/**
 * ÚNICA fuente de verdad para consultas a Supabase.
 * Todas las páginas y componentes deben importar desde aquí.
 * Nunca hacer queries directas fuera de este archivo.
 */
import { createClient } from '@/lib/supabase/server'
import type { Courier, MonthlyAds, OrderStatus, OrderSummary, Product } from '@/lib/types'

// ─── Pedidos ───────────────────────────────────────────────

export async function getOrders(): Promise<OrderSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('order_summary')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getOrders: ${error.message}`)
  return data as OrderSummary[]
}

export async function getOrderById(id: string): Promise<OrderSummary | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('order_summary')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getOrderById: ${error.message}`)
  }
  return data as OrderSummary
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`updateOrderStatus: ${error.message}`)
}

export async function saveOrderDetails(
  id: string,
  data: {
    tracking_number?: string
    courier_name?: string
    notes?: string
    status?: OrderStatus
  }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('orders')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(`saveOrderDetails: ${error.message}`)
}

export async function saveOrderCosts(
  orderId: string,
  costs: {
    product_cost: number
    packaging_cost: number
    delivery_cost: number
    quantity: number
    discount: number
    notes?: string
  }
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('order_costs')
    .upsert(
      { order_id: orderId, ...costs },
      { onConflict: 'order_id' }
    )

  if (error) throw new Error(`saveOrderCosts: ${error.message}`)
}

export async function getOrderCostsExtra(orderId: string): Promise<{
  quantity: number
  discount: number
  product_cost: number
  packaging_cost: number
  delivery_cost: number
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('order_costs')
    .select('quantity, discount, product_cost, packaging_cost, delivery_cost')
    .eq('order_id', orderId)
    .single()

  if (error || !data) return { quantity: 1, discount: 0, product_cost: 0, packaging_cost: 0, delivery_cost: 0 }
  return {
    quantity: data.quantity ?? 1,
    discount: data.discount ?? 0,
    product_cost: data.product_cost ?? 0,
    packaging_cost: data.packaging_cost ?? 0,
    delivery_cost: data.delivery_cost ?? 0,
  }
}

// ─── CPA por mes ───────────────────────────────────────────
//
// FUNCIÓN CENTRAL de cálculo de publicidad. Úsala en TODOS los lugares
// donde necesites mostrar el costo de ads por pedido:
// panel lateral, dashboard, cuadres. Nunca recalcules esta lógica inline.
//
// El CPA es configurado manualmente por el usuario desde Facebook/Meta Ads.

export async function getAdsCostForMonth(month: string): Promise<{
  adsCostPerOrder: number
  budgetDop: number
  orderCount: number
  isConfigured: boolean
}> {
  const supabase = createClient()

  const { data: ads, error: adsError } = await supabase
    .from('monthly_ads')
    .select('budget_dop, cpa_dop')
    .eq('month', month)
    .single()

  if (adsError && adsError.code !== 'PGRST116') {
    throw new Error(`getAdsCostForMonth (ads): ${adsError.message}`)
  }

  if (!ads) {
    return { adsCostPerOrder: 0, budgetDop: 0, orderCount: 0, isConfigured: false }
  }

  return {
    adsCostPerOrder: ads.cpa_dop ?? 0,
    budgetDop: ads.budget_dop ?? 0,
    orderCount: 0,
    isConfigured: true,
  }
}

export async function saveMonthlyAds(data: {
  month: string
  budget_usd: number
  exchange_rate: number
  cpa_dop: number
  notes?: string
}): Promise<void> {
  const supabase = createClient()
  // budget_dop es columna generada por PostgreSQL — no se incluye en el insert/update
  const { error } = await supabase
    .from('monthly_ads')
    .upsert(data, { onConflict: 'month' })

  if (error) throw new Error(`saveMonthlyAds: ${error.message}`)
}

/** Devuelve el primer día del mes siguiente en formato 'YYYY-MM-DD' */
function nextMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`
  return `${next}-01`
}

// ─── Couriers ─────────────────────────────────────────────

export async function getCouriers(): Promise<Courier[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('couriers')
    .select('*')
    .order('name')

  if (error) throw new Error(`getCouriers: ${error.message}`)
  return data as Courier[]
}

export async function createCourier(data: {
  name: string
  type: 'mensajero_sd' | 'transportadora'
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('couriers')
    .insert(data)

  if (error) throw new Error(`createCourier: ${error.message}`)
}

export async function toggleCourierActive(id: string, active: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('couriers')
    .update({ active })
    .eq('id', id)

  if (error) throw new Error(`toggleCourierActive: ${error.message}`)
}

export async function updateCourier(id: string, data: { name: string; type: 'mensajero_sd' | 'transportadora' }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('couriers')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(`updateCourier: ${error.message}`)
}

export async function deleteCourier(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('couriers')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`deleteCourier: ${error.message}`)
}

// ─── Publicidad mensual ───────────────────────────────────

export async function getMonthlyAds(month: string): Promise<MonthlyAds | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_ads')
    .select('*')
    .eq('month', month)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getMonthlyAds: ${error.message}`)
  }
  return data as MonthlyAds
}

export async function getAllMonthlyAds(): Promise<MonthlyAds[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('monthly_ads')
    .select('*')
    .order('month', { ascending: false })

  if (error) throw new Error(`getAllMonthlyAds: ${error.message}`)
  return data as MonthlyAds[]
}

// ─── Productos ────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at')

  if (error) throw new Error(`getProducts: ${error.message}`)
  return data as Product[]
}

export async function createProduct(data: { name: string; unit_price: number; initial_stock: number }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('products').insert(data)
  if (error) throw new Error(`createProduct: ${error.message}`)
}

export async function updateProduct(id: string, data: { name: string; unit_price: number; initial_stock: number }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) throw new Error(`updateProduct: ${error.message}`)
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(`deleteProduct: ${error.message}`)
}

