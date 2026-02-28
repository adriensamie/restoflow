import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json([])

  const { data: org } = await supabase
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  if (!org?.id) return NextResponse.json([])

  const { data } = await supabase
    .from('stock_actuel')
    .select('produit_id, nom, categorie, unite, quantite_actuelle')
    .eq('organization_id', org.id)
    .order('nom')

  return NextResponse.json(data ?? [])
}
