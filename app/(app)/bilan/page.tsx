import { BilanClient } from '@/components/bilan/bilan-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function BilanPage() {
  await requireRouteAccess('/bilan')
  return <BilanClient />
}
