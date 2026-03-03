import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { withRateLimit } from '@/lib/api-rate-limit'

export const GET = withRateLimit(async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()
  if (!orgId) return NextResponse.json([])

  const { data: org } = await supabase
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  if (!org?.id) return NextResponse.json([])

  const dateDebut = req.nextUrl.searchParams.get('date_debut')
  const dateFin = req.nextUrl.searchParams.get('date_fin')
  if (!dateDebut || !dateFin) return NextResponse.json([])

  const { data } = await supabase
    .from('creneaux_planning')
    .select('*, employes(prenom, nom, couleur, poste)')
    .eq('organization_id', org.id)
    .gte('date', dateDebut)
    .lte('date', dateFin)
    .order('date')
    .order('heure_debut')

  return NextResponse.json(data ?? [])
}, { maxRequests: 30, windowMs: 60 * 1000, prefix: 'planning-creneaux' })
