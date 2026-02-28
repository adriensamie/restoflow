import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel cron — daily check for DLC/DLUO expiration
// vercel.json: { "crons": [{ "path": "/api/cron/check-dlc", "schedule": "0 7 * * *" }] }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()

    // Find lots expiring in 3 days or less
    const dateLimite = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: lots } = await supabase
      .from('lots_produit')
      .select('organization_id, produit_id, dlc, quantite, produits:produit_id(nom)')
      .eq('statut', 'actif')
      .lte('dlc', dateLimite)

    if (!lots || lots.length === 0) {
      return NextResponse.json({ notifications: 0 })
    }

    // Group by org
    const byOrg = new Map<string, typeof lots>()
    for (const lot of lots) {
      if (!byOrg.has(lot.organization_id)) byOrg.set(lot.organization_id, [])
      byOrg.get(lot.organization_id)!.push(lot)
    }

    let count = 0
    for (const [orgId, orgLots] of byOrg) {
      await supabase.from('notifications').insert({
        organization_id: orgId,
        type: 'dlc_proche',
        titre: `${orgLots.length} lot(s) proche(s) d'expiration`,
        message: orgLots.map((l: any) => `${(l.produits as any)?.nom ?? 'Produit'} — DLC ${l.dlc}`).join(', '),
        lue: false,
        canal: ['in_app', 'web_push'],
      })
      count++
    }

    // Mark expired lots
    const today = new Date().toISOString().slice(0, 10)
    await supabase
      .from('lots_produit')
      .update({ statut: 'expire' })
      .eq('statut', 'actif')
      .lt('dlc', today)

    return NextResponse.json({ notifications: count })
  } catch (e: any) {
    console.error('CRON check-dlc error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
