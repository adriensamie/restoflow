import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/api-rate-limit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id')
      .eq('clerk_org_id', orgId)
      .is('parent_organization_id', null)
      .returns<{ stripe_customer_id: string | null }[]>()
      .single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'Pas de compte Stripe' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${req.nextUrl.origin}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    console.error('[billing/portal] Error:', e)
    return NextResponse.json(
      { error: 'Erreur lors de la creation du portail de facturation' },
      { status: 500 }
    )
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'billing-portal' })
