import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getOrgBilling, type OrgBilling } from '@/lib/billing'
import { TrialBanner } from '@/components/billing/trial-banner'
import { ExpiredBanner } from '@/components/billing/expired-banner'
import { getCurrentStaff, getAllowedRoutes } from '@/lib/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'

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

async function AppShell({ children, clerkOrgId }: { children: React.ReactNode; clerkOrgId: string }) {
  // Run billing and staff queries in parallel
  const [billingResult, staffResult] = await Promise.allSettled([
    getOrgBilling(),
    getCurrentStaff(),
  ])

  let billing = billingResult.status === 'fulfilled' ? billingResult.value : null
  const staff = staffResult.status === 'fulfilled' ? staffResult.value : null

  // If billing failed, use admin fallback (webhook might not have created the org)
  if (!billing) {
    const reason = billingResult.status === 'rejected' ? billingResult.reason : 'empty'
    console.error('[layout] getOrgBilling failed:', reason)
    billing = await getOrCreateOrgBilling(clerkOrgId)
  }

  // If still no billing after admin fallback, show error (don't redirect to avoid loop)
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

/**
 * Fallback: reads org billing with admin client (bypasses RLS/JWT issues).
 * If org doesn't exist in Supabase, creates it with trial defaults.
 */
async function getOrCreateOrgBilling(clerkOrgId: string): Promise<OrgBilling | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = createAdminClient() as any

    // Try to read existing org
    let { data } = await adminSupabase
      .from('organizations')
      .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
      .eq('clerk_org_id', clerkOrgId)
      .single()

    // Org doesn't exist — create it (webhook might have failed or not fired yet)
    if (!data) {
      const { orgSlug } = await auth()
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      const { error: insertError } = await adminSupabase.from('organizations').insert({
        clerk_org_id: clerkOrgId,
        nom: orgSlug || 'Mon restaurant',
        slug: orgSlug || null,
        plan: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        stripe_customer_id: null,
      })

      if (insertError) {
        console.error('[layout] Failed to create org:', insertError)
      } else {
        console.log('[layout] Created org in Supabase for', clerkOrgId)
      }

      // Re-read after insert
      const result = await adminSupabase
        .from('organizations')
        .select('plan, trial_ends_at, subscription_status, stripe_customer_id')
        .eq('clerk_org_id', clerkOrgId)
        .single()

      data = result.data
    }

    if (!data) return null

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
  } catch (e) {
    console.error('[layout] getOrCreateOrgBilling failed:', e)
    return null
  }
}
