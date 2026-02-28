import { FournisseursClient } from '@/components/commandes/fournisseurs-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function FournisseursPage() {
  await requireRouteAccess('/fournisseurs')
  const { supabase, orgId } = await getPageContext()

  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('*, produit_fournisseur(count)')
    .eq('actif', true)
    .eq('organization_id', orgId)
    .order('nom')

  return <FournisseursClient fournisseurs={fournisseurs ?? []} />
}
