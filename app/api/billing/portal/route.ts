import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/api-rate-limit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('clerk_org_id', orgId)
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
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'billing-portal' })
