import { getOrgBilling } from '@/lib/billing'
import { BillingClient } from '@/components/billing/billing-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function BillingPage() {
  await requireRouteAccess('/billing')
  const billing = await getOrgBilling()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Abonnement</h1>
        <p className="text-sm text-gray-400 mt-1">Gerez votre plan et votre facturation</p>
      </div>
      <BillingClient
        currentPlan={billing.plan}
        subscriptionStatus={billing.subscriptionStatus}
        daysLeft={billing.daysLeft}
      />
    </div>
  )
}
