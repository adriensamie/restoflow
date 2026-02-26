import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { ReceptionClient } from '@/components/commandes/reception-client'
import { notFound } from 'next/navigation'

export default async function CommandeDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: commande } = await (supabase as any)
    .from('commandes')
    .select('*, fournisseurs(nom, contact_telephone, contact_email)')
    .eq('id', params.id)
    .eq('organization_id', orgUUID)
    .single()

  if (!commande) notFound()

  const { data: lignes } = await (supabase as any)
    .from('commande_lignes')
    .select('*, produits(nom, unite, categorie)')
    .eq('commande_id', params.id)
    .order('created_at')

  return <ReceptionClient commande={commande} lignes={lignes ?? []} />
}
