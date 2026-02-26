import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { CommandesClient } from '@/components/commandes/commandes-client'

export default async function CommandesPage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: commandes } = await (supabase as any)
    .from('commandes')
    .select('*, fournisseurs(nom), commande_lignes(count)')
    .eq('organization_id', orgUUID)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: fournisseurs } = await (supabase as any)
    .from('fournisseurs')
    .select('id, nom')
    .eq('actif', true)
    .eq('organization_id', orgUUID)
    .order('nom')

  return <CommandesClient commandes={commandes ?? []} fournisseurs={fournisseurs ?? []} />
}
