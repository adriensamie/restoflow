import { hasAccess } from '@/lib/billing'
import { redirect } from 'next/navigation'
import { MultiSitesClient } from '@/components/multi-sites/multi-sites-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function MultiSitesPage() {
  await requireRouteAccess('/multi-sites')
  const allowed = await hasAccess('multi_sites')
  if (!allowed) redirect('/billing')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Multi-Sites</h1>
        <p className="text-sm text-gray-400 mt-1">Dashboard consolide et comparaison inter-sites</p>
      </div>
      <MultiSitesClient />
    </div>
  )
}
