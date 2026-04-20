export type OrderStatus =
  | 'pendiente' | 'en_preparacion' | 'empacado'
  | 'en_camino' | 'entregado' | 'cancelado' | 'devuelto' | 'problema'

export type Zone = 'santo_domingo' | 'interior'

export interface Order {
  id: string
  shopify_id: string
  order_number: string
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_province: string | null
  zone: Zone | null
  status: OrderStatus
  shopify_total: number
  tracking_number: string | null
  courier_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderCosts {
  id: string
  order_id: string
  product_cost: number
  packaging_cost: number
  delivery_cost: number
  quantity: number
  discount: number
  notes: string | null
}

export interface OrderSummary extends Order {
  product_cost: number
  packaging_cost: number
  delivery_cost: number
  total_cost_base: number
  gross_profit: number
}

export interface Courier {
  id: string
  name: string
  type: 'mensajero_sd' | 'transportadora'
  active: boolean
}

export interface Product {
  id: string
  name: string
  unit_price: number
  initial_stock: number
  created_at: string
}

export interface MonthlyAds {
  id: string
  month: string
  budget_usd: number
  exchange_rate: number
  budget_dop: number
  cpa_dop: number
  notes: string | null
}