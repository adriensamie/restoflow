'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { PLAN_FEATURES, PLAN_LABELS } from '@/lib/plans'
import type { Plan, Feature } from '@/lib/plans'

// ─── Billing info ───────────────────────────────────────────────────

export interface OrgBilling {
  plan: Plan
  trialEndsAt: string | null
  subscriptionStatus: string | null
  stripeCustomerId: string | null
  isTrialExpired: boolean
  daysLeft: number | null
}

export async function getOrgBilling(): Promise<OrgBilling> {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) throw new Error('Non authentifie')

  const { data, error } = await supabase
    .from('organizations')
    .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
    .eq('clerk_org_id', orgId)
    .returns<{
      plan: Plan
      trial_ends_at: string | null
      subscription_status: string | null
      stripe_customer_id: string | null
    }[]>()
    .single()

  if (error || !data) throw new Error('Organisation introuvable')

  const now = new Date()
  const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null
  const isTrialExpired = data.plan === 'trial' && trialEnd !== null && trialEnd < now
  const daysLeft = data.plan === 'trial' && trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  return {
    plan: data.plan,
    trialEndsAt: data.trial_ends_at,
    subscriptionStatus: data.subscription_status,
    stripeCustomerId: data.stripe_customer_id,
    isTrialExpired,
    daysLeft,
  }
}

// ─── Access checks ──────────────────────────────────────────────────

export async function hasAccess(feature: Feature): Promise<boolean> {
  const billing = await getOrgBilling()
  if (billing.isTrialExpired) return false
  if (billing.subscriptionStatus === 'past_due') return false
  return PLAN_FEATURES[billing.plan].includes(feature)
}

export async function checkAccess(feature: Feature): Promise<{ allowed: boolean; plan: Plan }> {
  const billing = await getOrgBilling()
  if (billing.isTrialExpired) return { allowed: false, plan: billing.plan }
  if (billing.subscriptionStatus === 'past_due') return { allowed: false, plan: billing.plan }
  return {
    allowed: PLAN_FEATURES[billing.plan].includes(feature),
    plan: billing.plan,
  }
}

export async function requireAccess(feature: Feature): Promise<void> {
  const { allowed, plan } = await checkAccess(feature)
  if (!allowed) {
    throw new Error(
      `Fonctionnalite "${feature}" non disponible avec le plan ${PLAN_LABELS[plan]}. Mettez a niveau votre abonnement.`
    )
  }
}
