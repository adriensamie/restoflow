import { PertesHeader } from '@/components/stocks/pertes-header'
import { PertesTable } from '@/components/stocks/pertes-table'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'

export default async function PertesPage() {
  await requireRouteAccess('/pertes')
  const { supabase, orgId } = await getPageContext()

  const { data: pertes } = await supabase
    .from('mouvements_stock')
    .select('*, produits(nom, unite, categorie)')
    .eq('organization_id', orgId)
    .eq('type', 'perte')
    .order('created_at', { ascending: false })
    .limit(200)

  // Total pertes ce mois
  const debutMois = new Date()
  debutMois.setDate(1)
  debutMois.setHours(0, 0, 0, 0)

  const { data: pertesMois } = await supabase
    .from('mouvements_stock')
    .select('quantite, prix_unitaire')
    .eq('organization_id', orgId)
    .eq('type', 'perte')
    .gte('created_at', debutMois.toISOString())

  const totalMois = pertesMois?.reduce((acc: number, p: { quantite: number; prix_unitaire: number | null }) => {
    return acc + (p.quantite * (p.prix_unitaire ?? 0))
  }, 0) ?? 0

  return (
    <div className="space-y-6">
      <PertesHeader totalMois={totalMois} />
      <PertesTable pertes={pertes ?? []} />
    </div>
  )
}
