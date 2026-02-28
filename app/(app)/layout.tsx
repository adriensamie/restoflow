import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { getOrgBilling } from '@/lib/billing'
import { TrialBanner } from '@/components/billing/trial-banner'
import { ExpiredBanner } from '@/components/billing/expired-banner'
import { getCurrentStaff, getAllowedRoutes } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, orgId } = await auth()

  if (!userId) redirect('/sign-in')
  if (!orgId) redirect('/onboarding')

  let billing
  try {
    billing = await getOrgBilling()
  } catch (e) {
    // Race condition: webhook hasn't created the org yet — wait briefly and retry
    console.error('[layout] getOrgBilling failed, retry in 1s:', e)
    await new Promise(r => setTimeout(r, 1000))
    try {
      billing = await getOrgBilling()
    } catch {
      // Still not ready — show onboarding
      redirect('/onboarding')
    }
  }

  if (!billing) redirect('/onboarding')

  let staff = null
  try {
    staff = await getCurrentStaff()
  } catch (e) {
    console.error('[layout] getCurrentStaff failed:', e)
  }

  const role = staff?.role ?? 'employe'
  let allowedRoutes = ['/dashboard']
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
