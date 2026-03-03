import { NouvelleCommandeClient } from '@/components/commandes/nouvelle-commande-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

interface Props {
  searchParams: Promise<{ bl?: string }>
}

export default async function NouvelleCommandePage({ searchParams }: Props) {
  await requireRouteAccess('/commandes')
  const { supabase, orgId } = await getPageContext()
  const params = await searchParams

  const { data: fournisseurs } = await supabase
    .from('fournisseurs')
    .select('*')
    .eq('actif', true)
    .eq('organization_id', orgId)
    .order('nom')

  // Decode BL pre-fill data from searchParam
  let blPreRempli = null
  if (params.bl) {
    try {
      blPreRempli = JSON.parse(decodeURIComponent(params.bl))
    } catch {}
  }

  return <NouvelleCommandeClient fournisseurs={fournisseurs ?? []} blPreRempli={blPreRempli} />
}
