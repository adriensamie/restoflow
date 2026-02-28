import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_IDS, type PlanId } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/api-rate-limit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { plan } = (await req.json()) as { plan: PlanId }
  if (!PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id, nom')
    .eq('clerk_org_id', orgId)
    .returns<{ id: string; stripe_customer_id: string | null; nom: string }[]>()
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organisation introuvable' }, { status: 404 })
  }

  // Create Stripe customer if missing
  let customerId = org.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.nom,
      metadata: { clerk_org_id: orgId, org_id: org.id },
    })
    customerId = customer.id
    await (supabase as any)
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${req.nextUrl.origin}/billing?success=true`,
    cancel_url: `${req.nextUrl.origin}/billing?canceled=true`,
    metadata: { org_id: org.id, plan },
  })

  return NextResponse.json({ url: session.url })
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'billing-checkout' })
