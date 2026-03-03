import { BilanClient } from '@/components/bilan/bilan-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { requireAccess } from '@/lib/billing'

export default async function BilanPage() {
  await requireRouteAccess('/bilan')
  await requireAccess('bilan_journee')
  return <BilanClient />
}
