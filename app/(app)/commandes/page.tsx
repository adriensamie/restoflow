import { CommandesClient } from '@/components/commandes/commandes-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function CommandesPage() {
  await requireRouteAccess('/commandes')
  const { supabase, orgId } = await getPageContext()

  const [{ data: commandes }, { data: fournisseurs }] = await Promise.all([
    (supabase as any)
      .from('commandes')
      .select('*, fournisseurs(nom), commande_lignes(count)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100),
    (supabase as any)
      .from('fournisseurs')
      .select('id, nom')
      .eq('actif', true)
      .eq('organization_id', orgId)
      .order('nom'),
  ])

  return <CommandesClient commandes={commandes ?? []} fournisseurs={fournisseurs ?? []} />
}
