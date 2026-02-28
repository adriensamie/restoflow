import { createServerSupabaseClient } from '@/lib/supabase/server'
import webpush from 'web-push'

export type NotificationType =
  | 'stock_critique'
  | 'ecart_livraison'
  | 'haccp_non_conforme'
  | 'annulation_suspecte'
  | 'hausse_prix'
  | 'dlc_proche'
  | 'retour_statut'
  | 'commande_statut'
  | 'info'

// Configure VAPID (run once at module level)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contact@restoflow.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function createNotification(params: {
  organizationId: string
  staffId?: string | null
  type: NotificationType
  titre: string
  message: string
  metadata?: Record<string, any>
  canal?: string[]
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await (supabase as any).from('notifications').insert({
    organization_id: params.organizationId,
    staff_id: params.staffId ?? null,
    type: params.type,
    titre: params.titre,
    message: params.message,
    metadata: params.metadata ?? null,
    canal: params.canal ?? ['in_app'],
    lue: false,
  })
  if (error) throw new Error(error.message)

  // Dispatch push if canal includes web_push
  if (params.canal?.includes('web_push')) {
    await sendPushNotifications(params.organizationId, params.staffId ?? null, {
      title: params.titre,
      body: params.message,
      data: { type: params.type, ...params.metadata },
    })
  }
}

export async function dispatchNotification(params: {
  organizationId: string
  staffId?: string | null
  type: NotificationType
  titre: string
  message: string
  metadata?: Record<string, any>
}) {
  const supabase = await createServerSupabaseClient()

  // Check notification preferences
  let canaux = ['in_app']

  if (params.staffId) {
    const { data: prefs } = await (supabase as any)
      .from('notification_preferences')
      .select('in_app, web_push, email')
      .eq('organization_id', params.organizationId)
      .eq('staff_id', params.staffId)
      .eq('type', params.type)
      .single()

    if (prefs) {
      canaux = []
      if (prefs.in_app) canaux.push('in_app')
      if (prefs.web_push) canaux.push('web_push')
      if (prefs.email) canaux.push('email')
    }
  }

  await createNotification({ ...params, canal: canaux })
}

async function sendPushNotifications(
  organizationId: string,
  staffId: string | null,
  payload: { title: string; body: string; data?: any }
) {
  try {
    const supabase = await createServerSupabaseClient()

    let query = (supabase as any)
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('organization_id', organizationId)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    const { data: subscriptions } = await query

    if (!subscriptions || subscriptions.length === 0) return

    const pushPayload = JSON.stringify(payload)

    await Promise.allSettled(
      subscriptions.map((sub: any) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          pushPayload
        )
      )
    )
  } catch {
    // Push failures are non-blocking
  }
}
