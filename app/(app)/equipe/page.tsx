import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { EquipeClient } from '@/components/equipe/equipe-client'

export default async function EquipePage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const { data: employes } = await (supabase as any)
    .from('employes')
    .select('*, contrats(*)')
    .eq('organization_id', orgUUID)
    .order('poste').order('prenom')

  return <EquipeClient employes={employes ?? []} />
}
