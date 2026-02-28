import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json([])

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  if (!org?.id) return NextResponse.json([])

  const { data } = await (supabase as any)
    .from('produits')
    .select('id, nom, categorie, unite')
    .eq('actif', true)
    .eq('organization_id', org.id)
    .order('nom')

  return NextResponse.json(data ?? [])
}
