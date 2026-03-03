import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Plan } from '@/lib/plans'

function getPriceToPlan(): Record<string, Plan> {
  return {
    [process.env.STRIPE_PRICE_STARTER!]: 'starter',
    [process.env.STRIPE_PRICE_PRO!]: 'pro',
    [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  console.log('[stripe webhook] event:', event.type)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const plan = session.metadata?.plan as Plan | undefined
      const orgId = session.metadata?.org_id

      console.log('[stripe webhook] checkout.session.completed:', {
        customerId, subscriptionId, plan, orgId,
        metadata: session.metadata,
      })

      if (!plan) {
        console.error('[stripe webhook] SKIP: pas de plan dans metadata')
        break
      }

      const updates = {
        plan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'active',
        trial_ends_at: null,
      }

      // Try by org_id first (most reliable), then fallback to stripe_customer_id
      let success = false

      if (orgId) {
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', orgId)
          .select('id')
        console.log('[stripe webhook] update by org_id:', { orgId, data, error })
        if (data && data.length > 0) success = true
      }

      if (!success) {
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('stripe_customer_id', customerId)
          .select('id')
        console.log('[stripe webhook] update by customer_id:', { customerId, data, error })
        if (data && data.length > 0) success = true
      }

      if (!success) {
        console.error('[stripe webhook] ECHEC: aucune org mise a jour pour', { orgId, customerId })
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const customerId = subscription.customer as string
      const status = subscription.status
      const priceId = subscription.items.data[0]?.price?.id
      const plan = priceId ? getPriceToPlan()[priceId] : undefined

      const updates: Record<string, unknown> = {
        subscription_status: status,
      }
      if (plan) updates.plan = plan

      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('stripe_customer_id', customerId)
      if (error) console.error('Stripe webhook subscription.updated error:', error)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const customerId = subscription.customer as string

      const { error } = await supabase
        .from('organizations')
        .update({
          plan: 'trial',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId)
      if (error) console.error('Stripe webhook subscription.deleted error:', error)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer as string

      const { error } = await supabase
        .from('organizations')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
      if (error) console.error('Stripe webhook payment_failed error:', error)
      break
    }
  }

  return NextResponse.json({ received: true })
}
