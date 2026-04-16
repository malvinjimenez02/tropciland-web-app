import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyHmac(body: string, signature: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

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
  const isSantoDomingo = sdKeywords.some((kw) => combined.includes(kw))

  return isSantoDomingo ? 'santo_domingo' : 'interior'
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const body = await req.text()

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? ''
  const computed = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  console.log('[shopify-webhook] received signature:', signature)
  console.log('[shopify-webhook] computed signature:', computed)
  console.log('[shopify-webhook] secret length:', secret.length)

  let signatureValid: boolean
  try {
    signatureValid = verifyHmac(body, signature)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!signatureValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  const shippingAddress: Record<string, string> | undefined = payload.shipping_address
  const billingAddress: Record<string, string> | undefined = payload.billing_address
  const customer = payload.customer

  const shopifyId = String(payload.id)
  const orderNumber = payload.name

  let customerName: string | null = null
  if (customer?.first_name || customer?.last_name) {
    customerName = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
  } else if (billingAddress?.name) {
    customerName = billingAddress.name
  }

  const customerPhone =
    customer?.phone ?? billingAddress?.phone ?? shippingAddress?.phone ?? null

  const customerAddress =
    extractAddress(shippingAddress) ?? extractAddress(billingAddress)

  const shopifyTotal = parseFloat(payload.total_price)
  const zone = detectZone(shippingAddress)

  const supabase = getServiceRoleClient()

  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('shopify_id', shopifyId)
    .maybeSingle()

  if (!existing) {
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        shopify_id: shopifyId,
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        shopify_total: shopifyTotal,
        zone: zone,
        shopify_data: payload,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[shopify-webhook] insert order error:', insertError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const { error: costsError } = await supabase
      .from('order_costs')
      .insert({ order_id: newOrder.id })

    if (costsError) {
      console.error('[shopify-webhook] insert order_costs error:', costsError)
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
