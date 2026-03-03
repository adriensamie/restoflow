/**
 * scripts/cleanup.ts
 * Delete all orgs except the main "Adrien" enterprise org, wipe all data
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv()

const TABLES_WITH_ORG = [
  'lignes_retour', 'retours_fournisseur', 'lots_produit', 'prix_produit_historique',
  'notifications', 'notification_preferences', 'push_subscriptions', 'role_permissions',
  'pin_sessions', 'lignes_inventaire', 'sessions_inventaire', 'mouvements_cave',
  'objectifs_kpi', 'haccp_releves', 'haccp_templates', 'fiches_paie',
  'creneaux_planning', 'employes', 'snapshots_food_cost', 'previsions',
  'events_caisse', 'config_caisse', 'recette_ingredients', 'recettes',
  'mouvements_stock', 'commande_lignes', 'commandes', 'produit_fournisseur',
  'fournisseurs', 'vins', 'produits', 'staff',
]

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const KEEP_ID = 'eb119f7b-e1ca-4ee3-aa03-d350a50ed394' // Adrien

  // 1. Get all org ids to delete
  const { data: allOrgs } = await sb.from('organizations').select('id, nom')
  const toDelete = (allOrgs ?? []).filter(o => o.id !== KEEP_ID)
  const allIds = (allOrgs ?? []).map(o => o.id)

  console.log(`Keeping: Adrien (${KEEP_ID})`)
  console.log(`Deleting ${toDelete.length} orgs: ${toDelete.map(o => o.nom).join(', ')}`)

  // 2. Wipe ALL data from all orgs (including Adrien)
  for (const orgId of allIds) {
    console.log(`\nWiping data for ${orgId}...`)

    // commande_lignes via commande FK
    const { data: cmds } = await sb.from('commandes').select('id').eq('organization_id', orgId)
    if (cmds?.length) {
      for (let i = 0; i < cmds.length; i += 500) {
        const ids = cmds.slice(i, i + 500).map(c => c.id)
        await sb.from('commande_lignes').delete().in('commande_id', ids)
      }
    }

    // lignes_retour via retour FK
    const { data: rets } = await sb.from('retours_fournisseur').select('id').eq('organization_id', orgId)
    if (rets?.length) {
      for (let i = 0; i < rets.length; i += 500) {
        const ids = rets.slice(i, i + 500).map(r => r.id)
        await sb.from('lignes_retour').delete().in('retour_id', ids)
      }
    }

    for (const table of TABLES_WITH_ORG) {
      if (table === 'commande_lignes' || table === 'lignes_retour') continue
      const { error } = await (sb.from(table) as any).delete().eq('organization_id', orgId)
      if (error && !error.message.includes('schema cache') && !error.message.includes('does not exist'))
        console.error(`  ${table}: ${error.message}`)
    }
  }

  // 3. Delete child/extra orgs
  for (const org of toDelete) {
    const { error } = await sb.from('organizations').delete().eq('id', org.id)
    if (error) console.error(`  Delete org ${org.nom}: ${error.message}`)
    else console.log(`  Deleted org: ${org.nom}`)
  }

  // 4. Reset Adrien to clean state
  const { error } = await sb.from('organizations').update({
    parent_organization_id: null,
    plan: 'trial',
  }).eq('id', KEEP_ID)
  if (error) console.error('Reset Adrien:', error.message)
  else console.log('\nAdrien reset to trial (upgrade to enterprise via billing)')

  // Verify
  const { data: remaining } = await sb.from('organizations').select('id, nom, plan')
  console.log('\nRemaining orgs:', remaining)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
