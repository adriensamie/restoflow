import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { FournisseursClient } from '@/components/commandes/fournisseurs-client'
import { requireRouteAccess } from '@/lib/require-route-access'

export default async function FournisseursPage() {
  await requireRouteAccess('/fournisseurs')
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: fournisseurs } = await (supabase as any)
    .from('fournisseurs')
    .select('*, produit_fournisseur(count)')
    .eq('actif', true)
    .eq('organization_id', orgUUID)
    .order('nom')

  return <FournisseursClient fournisseurs={fournisseurs ?? []} />
}
