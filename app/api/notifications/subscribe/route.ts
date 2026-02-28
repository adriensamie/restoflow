import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID, getCurrentStaff } from '@/lib/auth'
import { withRateLimit } from '@/lib/api-rate-limit'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const { subscription } = await req.json()
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const organization_id = await getOrgUUID()
    const staff = await getCurrentStaff()

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        organization_id,
        staff_id: staff?.staffId ?? '',
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh ?? '',
        auth_key: subscription.keys?.auth ?? '',
      }, { onConflict: 'endpoint' })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('PUSH SUBSCRIBE ERROR:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription aux notifications' }, { status: 500 })
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'push-subscribe' })
