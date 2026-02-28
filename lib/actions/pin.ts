'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { hashPin, verifyPin, createPinSession, clearPinSession } from '@/lib/pin-auth'
import { setPinSchema, authenticatePinSchema } from '@/lib/validations/pin'
import { checkRateLimit } from '@/lib/rate-limit'
import { revalidatePath } from 'next/cache'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function setStaffPin(staffId: string, pin: string) {
  setPinSchema.parse({ staff_id: staffId, pin })
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const pinHash = await hashPin(pin)
  const { error } = await supabase
    .from('staff')
    .update({ pin_hash: pinHash, pin_changed_at: new Date().toISOString() })
    .eq('id', staffId)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/equipe')
}

export async function removeStaffPin(staffId: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await supabase
    .from('staff')
    .update({ pin_hash: null })
    .eq('id', staffId)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/equipe')
}

export async function authenticatePin(organizationId: string, staffId: string, pin: string) {
  authenticatePinSchema.parse({ organization_id: organizationId, staff_id: staffId, pin })

  // Rate limit: 5 attempts per 5 minutes per staff
  const rl = checkRateLimit(`pin:${staffId}`, 5, 5 * 60 * 1000)
  if (!rl.allowed) throw new Error('Trop de tentatives. Reessayez dans quelques minutes.')

  const supabase = await createServerSupabaseClient()

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, pin_hash, role, nom, prenom, organization_id, pin_changed_at')
    .eq('id', staffId)
    .eq('organization_id', organizationId)
    .eq('actif', true)
    .single()

  if (error || !staff || !staff.pin_hash) throw new Error('Employe introuvable ou PIN non configure')

  const valid = await verifyPin(pin, staff.pin_hash)
  if (!valid) throw new Error('PIN incorrect')

  await createPinSession({
    staffId: staff.id,
    orgId: staff.organization_id,
    role: staff.role,
    nom: staff.nom,
    prenom: staff.prenom,
    pinChangedAt: staff.pin_changed_at ?? undefined,
  })

  return { staffId: staff.id, role: staff.role, nom: staff.nom, prenom: staff.prenom }
}

export async function authenticatePinKiosk(organizationId: string, pin: string) {
  // Validate UUID format
  if (!UUID_REGEX.test(organizationId)) throw new Error('Organisation invalide')

  // Rate limit: 5 attempts per 5 minutes per org (kiosk)
  const rl = checkRateLimit(`pin-kiosk:${organizationId}`, 5, 5 * 60 * 1000)
  if (!rl.allowed) throw new Error('Trop de tentatives. Reessayez dans quelques minutes.')

  const supabase = await createServerSupabaseClient()

  // Verify org exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single()
  if (!org) throw new Error('Organisation introuvable')

  const { data: staffList } = await supabase
    .from('staff')
    .select('id, pin_hash, nom, prenom, organization_id, pin_changed_at')
    .eq('organization_id', organizationId)
    .eq('actif', true)
    .not('pin_hash', 'is', null)

  if (!staffList || staffList.length === 0) throw new Error('Aucun employe avec PIN')

  for (const staff of staffList) {
    const valid = await verifyPin(pin, staff.pin_hash!)
    if (valid) {
      // Fetch role separately (not exposed in kiosk list)
      const { data: fullStaff } = await supabase
        .from('staff')
        .select('role')
        .eq('id', staff.id)
        .single()

      await createPinSession({
        staffId: staff.id,
        orgId: staff.organization_id,
        role: fullStaff?.role ?? 'employe',
        nom: staff.nom,
        prenom: staff.prenom,
        pinChangedAt: staff.pin_changed_at ?? undefined,
      })
      return { staffId: staff.id, role: fullStaff?.role ?? 'employe', nom: staff.nom, prenom: staff.prenom }
    }
  }

  throw new Error('PIN incorrect')
}

export async function validatePinSessionWithCheck() {
  const { validatePinSession: validate } = await import('@/lib/pin-auth')
  const session = await validate()
  if (!session) return null

  // If session has pinChangedAt, verify staff hasn't changed PIN since
  if (session.pinChangedAt) {
    const supabase = await createServerSupabaseClient()
    const { data: staff } = await supabase
      .from('staff')
      .select('pin_changed_at')
      .eq('id', session.staffId)
      .eq('organization_id', session.orgId)
      .single()

    if (staff?.pin_changed_at && staff.pin_changed_at !== session.pinChangedAt) {
      await clearPinSession()
      return null
    }
  }

  return session
}

export async function logoutPin() {
  await clearPinSession()
}

export async function getStaffListForKiosk(organizationId: string) {
  // Validate UUID format
  if (!UUID_REGEX.test(organizationId)) throw new Error('Organisation invalide')

  const supabase = await createServerSupabaseClient()

  // Verify org exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single()
  if (!org) throw new Error('Organisation introuvable')

  const { data } = await supabase
    .from('staff')
    .select('id, nom, prenom, initiales')
    .eq('organization_id', organizationId)
    .eq('actif', true)
    .not('pin_hash', 'is', null)
    .order('nom')

  return data ?? []
}
