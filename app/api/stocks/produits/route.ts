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

  const fournisseurId = req.nextUrl.searchParams.get('fournisseur_id')

  if (fournisseurId) {
    // Get product IDs linked to this fournisseur
    const { data: liens } = await supabase
      .from('produit_fournisseur')
      .select('produit_id')
      .eq('fournisseur_id', fournisseurId)
      .eq('organization_id', org.id)

    const produitIds = (liens ?? []).map(l => l.produit_id)
    if (produitIds.length === 0) return NextResponse.json([])

    const { data } = await supabase
      .from('stock_actuel')
      .select('produit_id, nom, categorie, unite, quantite_actuelle')
      .eq('organization_id', org.id)
      .in('produit_id', produitIds)
      .order('categorie')
      .order('nom')

    return NextResponse.json(data ?? [])
  }

  const { data } = await supabase
    .from('stock_actuel')
    .select('produit_id, nom, categorie, unite, quantite_actuelle')
    .eq('organization_id', org.id)
    .order('nom')

  return NextResponse.json(data ?? [])
}, { maxRequests: 30, windowMs: 60 * 1000, prefix: 'stocks-produits' })
