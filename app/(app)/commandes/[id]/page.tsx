import { ReceptionClient } from '@/components/commandes/reception-client'
import { requireRouteAccess } from '@/lib/require-route-access'
import { getPageContext } from '@/lib/page-context'
import { notFound } from 'next/navigation'

export default async function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRouteAccess('/commandes')
  const { id } = await params
  const { supabase, orgId } = await getPageContext()

  const { data: commande } = await (supabase as any)
    .from('commandes')
    .select('*, fournisseur_id, fournisseurs(nom, contact_telephone, contact_email)')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (!commande) notFound()

  const { data: lignes } = await (supabase as any)
    .from('commande_lignes')
    .select('*, produits(nom, unite, categorie)')
    .eq('commande_id', id)
    .order('created_at')

  return <ReceptionClient commande={commande} lignes={lignes ?? []} />
}
