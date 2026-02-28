'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'

const updatePreferenceSchema = z.object({
  staff_id: z.string().uuid(),
  type: z.string().min(1).max(100),
  in_app: z.boolean(),
  web_push: z.boolean(),
  email: z.boolean(),
})

export async function getNotifications(limit = 50) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { count, error } = await (supabase as any)
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organization_id)
    .eq('lue', false)

  if (error) return 0
  return count ?? 0
}

export async function markAsRead(notificationId: string) {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('notifications')
    .update({ lue: true })
    .eq('id', notificationId)
    .eq('organization_id', organization_id)

  if (error) throw new Error(error.message)
}

export async function markAllAsRead() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('notifications')
    .update({ lue: true })
    .eq('organization_id', organization_id)
    .eq('lue', false)

  if (error) throw new Error(error.message)
}

export async function getNotificationPreferences() {
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { data } = await (supabase as any)
    .from('notification_preferences')
    .select('*')
    .eq('organization_id', organization_id)

  return data ?? []
}

export async function updatePreference(data: {
  staff_id: string
  type: string
  in_app: boolean
  web_push: boolean
  email: boolean
}) {
  const validated = updatePreferenceSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await (supabase as any)
    .from('notification_preferences')
    .upsert({
      organization_id,
      staff_id: validated.staff_id,
      type: validated.type,
      in_app: validated.in_app,
      web_push: validated.web_push,
      email: validated.email,
    }, { onConflict: 'organization_id,staff_id,type' })

  if (error) throw new Error(error.message)
  revalidatePath('/parametres')
}
