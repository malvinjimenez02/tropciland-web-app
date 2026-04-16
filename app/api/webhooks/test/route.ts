import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getServiceRoleClient()

  const testShopifyId = `TEST-${Date.now()}`

  const testPayload = {
    id: testShopifyId,
    name: '#1001',
    customer: {
      first_name: 'Carlos',
      last_name: 'Martínez',
      phone: '+18096541234',
    },
    shipping_address: {
      address1: 'Av. Winston Churchill 15, Torre Acropolis',
      city: 'Santo Domingo',
      province: 'Distrito Nacional',
      country: 'Dominican Republic',
      phone: '+18096541234',
    },
    billing_address: {
      name: 'Carlos Martínez',
      address1: 'Av. Winston Churchill 15',
      city: 'Santo Domingo',
      province: 'Distrito Nacional',
      phone: '+18096541234',
    },
    total_price: '3500.00',
    line_items: [
      { title: 'Camisa Tropical Talla M', quantity: 2, price: '1750.00' },
    ],
    financial_status: 'paid',
    created_at: new Date().toISOString(),
  }

  const { data: newOrder, error: insertError } = await supabase
    .from('orders')
    .insert({
      shopify_id: testShopifyId,
      order_number: testPayload.name,
      customer_name: 'Carlos Martínez',
      customer_phone: '+18096541234',
      customer_address: 'Av. Winston Churchill 15, Torre Acropolis, Santo Domingo, Distrito Nacional',
      shopify_total: 3500.0,
      zone: 'santo_domingo',
      shopify_data: testPayload,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('order_costs').insert({ order_id: newOrder.id })

  return NextResponse.json({ ok: true, order: newOrder })
}
