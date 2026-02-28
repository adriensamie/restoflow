import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { TrialBanner } from '@/components/billing/trial-banner'
import { ExpiredBanner } from '@/components/billing/expired-banner'
import { getCurrentStaff, getAllowedRoutes } from '@/lib/rbac'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Plan } from '@/lib/plans'
export const dynamic = 'force-dynamic'

// Local type — avoids importing from 'use server' billing.ts
interface OrgBilling {
  plan: Plan
  trialEndsAt: string | null
  subscriptionStatus: string | null
  stripeCustomerId: string | null
  isTrialExpired: boolean
  daysLeft: number | null
}

function LayoutSkeleton() {
  return (
    <div className="flex h-screen" style={{ background: '#080d1a' }}>
      <div
        className="hidden md:flex flex-col"
        style={{ width: '16rem', background: '#0d1526', borderRight: '1px solid #1e2d4a' }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e2d4a' }}>
          <div className="h-5 w-28 rounded" style={{ background: '#1e2d4a' }} />
        </div>
        <div style={{ padding: '1rem' }} className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg" style={{ background: '#1e2d4a', opacity: 0.5 - i * 0.06 }} />
          ))}
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          className="flex items-center justify-between px-6"
          style={{ height: '4rem', background: '#0d1526', borderBottom: '1px solid #1e2d4a' }}
        >
          <div className="h-4 w-32 rounded" style={{ background: '#1e2d4a' }} />
          <div className="h-8 w-8 rounded-full" style={{ background: '#1e2d4a' }} />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="flex gap-1.5 justify-center mb-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full animate-bounce"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Chargement...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = await auth()

  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <AppShell clerkOrgId={orgId}>{children}</AppShell>
    </Suspense>
  )
}

/** Query org billing directly (no 'use server' dependency) */
async function fetchOrgBilling(clerkOrgId: string): Promise<OrgBilling | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
      .eq('clerk_org_id', clerkOrgId)
      .single()

    if (error || !data) return null
    return toBilling(data)
  } catch {
    return null
  }
}

/** Admin fallback: read/create org bypassing RLS */
async function fetchOrgBillingAdmin(clerkOrgId: string): Promise<OrgBilling | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any

    let { data } = await adminSupabase
      .from('organizations')
      .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
      .eq('clerk_org_id', clerkOrgId)
      .single()

    if (!data) {
      // Org missing in Supabase — create it (webhook delay/failure)
      const { orgSlug } = await auth()
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      await adminSupabase.from('organizations').insert({
        clerk_org_id: clerkOrgId,
        nom: orgSlug || 'Mon restaurant',
        slug: orgSlug || null,
        plan: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: null,
      })

      console.log('[layout] Created org in Supabase for', clerkOrgId)

      const result = await adminSupabase
        .from('organizations')
        .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
        .eq('clerk_org_id', clerkOrgId)
        .single()
      data = result.data
    }

    if (!data) return null
    return toBilling(data)
  } catch (e) {
    console.error('[layout] fetchOrgBillingAdmin failed:', e)
    return null
  }
}

function toBilling(data: { plan: Plan; trial_ends_at: string | null; subscription_status: string | null; stripe_customer_id: string | null }): OrgBilling {
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

async function AppShell({ children, clerkOrgId }: { children: React.ReactNode; clerkOrgId: string }) {
  // Run billing (direct query, no 'use server') and staff in parallel
  const [billingResult, staffResult] = await Promise.allSettled([
    fetchOrgBilling(clerkOrgId),
    getCurrentStaff(),
  ])

  let billing = billingResult.status === 'fulfilled' ? billingResult.value : null
  const staff = staffResult.status === 'fulfilled' ? staffResult.value : null

  // If RLS query failed, use admin fallback
  if (!billing) {
    console.error('[layout] fetchOrgBilling failed, trying admin fallback...')
    billing = await fetchOrgBillingAdmin(clerkOrgId)
  }

  // If still no billing, show error (no redirect to avoid loops)
  if (!billing) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#080d1a' }}>
        <div className="text-center max-w-md p-8 rounded-2xl"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>
            Impossible de charger votre restaurant
          </h2>
          <p className="text-sm mb-4" style={{ color: '#4a6fa5' }}>
            La connexion à la base de données a échoué. Vérifiez votre connexion et réessayez.
          </p>
          <a
            href="/dashboard"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            Réessayer
          </a>
        </div>
      </div>
    )
  }

  const role = staff?.role ?? 'employe'
  let allowedRoutes: string[] = ['/dashboard']
  try {
    if (staff) allowedRoutes = await getAllowedRoutes(role, staff.orgId)
  } catch (e) {
    console.error('[layout] getAllowedRoutes failed:', e)
  }

  return (
    <div className="flex h-screen" style={{ background: '#080d1a' }}>
      <Sidebar plan={billing.plan} role={role} allowedRoutes={allowedRoutes} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {billing.isTrialExpired && (
          <ExpiredBanner reason="trial_expired" />
        )}
        {billing.subscriptionStatus === 'past_due' && (
          <ExpiredBanner reason="past_due" />
        )}
        {billing.plan === 'trial' && !billing.isTrialExpired && billing.daysLeft !== null && (
          <TrialBanner daysLeft={billing.daysLeft} />
        )}
        <Header role={role} staffName={staff ? `${staff.prenom} ${staff.nom}`.trim() : ''} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
