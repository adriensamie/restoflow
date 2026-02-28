// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET manquant' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Headers svix manquants' }, { status: 400 })
  }

  const payload = await req.text()

  let event: any
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const eventType: string = event.type
  const data = event.data

  try {
    if (eventType === 'organization.created') {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      // Create Stripe customer
      const customer = await stripe.customers.create({
        name: data.name,
        metadata: { clerk_org_id: data.id },
      })

      await supabase.from('organizations').insert({
        clerk_org_id: data.id,
        nom: data.name,
        slug: data.slug ?? null,
        plan: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: customer.id,
      })
    }

    if (eventType === 'organization.updated') {
      await supabase
        .from('organizations')
        .update({ nom: data.name, slug: data.slug ?? null })
        .eq('clerk_org_id', data.id)
    }

    if (eventType === 'organizationMembership.created') {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', data.organization?.id)
        .single()

      if (org) {
        const firstName = data.public_user_data?.first_name || ''
        const lastName = data.public_user_data?.last_name || ''
        const initiales = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'XX'
        await supabase.from('staff').upsert({
          organization_id: org.id,
          clerk_user_id: data.public_user_data?.user_id,
          clerk_org_role: data.role,
          nom: lastName || 'Sans nom',
          prenom: firstName || 'Sans prénom',
          initiales,
          email: data.public_user_data?.identifier ?? null,
          role: data.role === 'org:admin' ? 'patron' : 'employe',
          actif: true,
        }, { onConflict: 'clerk_user_id' })
      }
    }

    if (eventType === 'organizationMembership.deleted') {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', data.organization?.id)
        .single()

      if (org) {
        await supabase
          .from('staff')
          .update({ actif: false })
          .eq('clerk_user_id', data.public_user_data?.user_id)
          .eq('organization_id', org.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}