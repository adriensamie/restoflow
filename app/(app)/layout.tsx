import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getOrgBilling } from '@/lib/billing'
import { TrialBanner } from '@/components/billing/trial-banner'
import { ExpiredBanner } from '@/components/billing/expired-banner'
import { getCurrentStaff, getAllowedRoutes } from '@/lib/rbac'
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
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}

async function AppShell({ children }: { children: React.ReactNode }) {
  // Run billing and staff queries in parallel
  const [billingResult, staffResult] = await Promise.allSettled([
    getOrgBilling(),
    getCurrentStaff(),
  ])

  let billing = billingResult.status === 'fulfilled' ? billingResult.value : null
  const staff = staffResult.status === 'fulfilled' ? staffResult.value : null

  // If billing failed, retry once after a short delay
  if (!billing) {
    const reason = billingResult.status === 'rejected' ? billingResult.reason : 'empty'
    console.error('[layout] getOrgBilling failed:', reason)
    await new Promise(r => setTimeout(r, 500))
    try {
      billing = await getOrgBilling()
    } catch {
      redirect('/onboarding')
    }
  }

  if (!billing) redirect('/onboarding')

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
