import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { InventaireClient } from '@/components/inventaire/inventaire-client'

export default async function InventairePage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const [{ data: produits }, { data: vins }, { data: sessions }] = await Promise.all([
    (supabase as any)
      .from('produits')
      .select('id, nom, categorie, unite, stock_actuel')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('categorie').order('nom'),
    (supabase as any)
      .from('vins')
      .select('id, nom, appellation, categorie, stock_bouteilles')
      .eq('actif', true)
      .eq('organization_id', orgUUID)
      .order('categorie').order('nom'),
    (supabase as any)
      .from('sessions_inventaire')
      .select('*, lignes_inventaire(count)')
      .eq('organization_id', orgUUID)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return (
    <InventaireClient
      produits={produits ?? []}
      vins={vins ?? []}
      sessions={sessions ?? []}
    />
  )
}
