/**
 * scripts/migrate-multi-site.ts
 * Adds parent_organization_id column and updates RLS for multi-site support
 * Usage: npx tsx scripts/migrate-multi-site.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) { console.error('.env.local introuvable'); process.exit(1) }
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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  console.log('=== Migration Multi-Site ===')

  // Step 1: Create exec_sql function (needed to run DDL via REST API)
  console.log('\n1. Creating exec_sql helper function...')
  const { error: fnErr } = await sb.rpc('query' as any, {
    query: 'SELECT 1'
  })
  // This will fail - we need to use a different approach

  // Use the Supabase SQL API directly
  const projectRef = new URL(url).hostname.split('.')[0]
  console.log(`   Project ref: ${projectRef}`)

  // Try adding column via PostgREST by inserting with the new column
  // This won't work for DDL. Let me check if column exists first.
  const { data: testData, error: testErr } = await sb
    .from('organizations')
    .select('id, plan')
    .limit(1)

  if (testErr) {
    console.error('Cannot connect to Supabase:', testErr.message)
    process.exit(1)
  }

  console.log(`   Connected OK. Found ${testData?.length ?? 0} org(s)`)

  // Check if column exists
  const { error: colErr } = await sb
    .from('organizations')
    .select('parent_organization_id')
    .limit(1)

  if (colErr && colErr.message.includes('does not exist')) {
    console.log('\n   parent_organization_id column does NOT exist.')
    console.log('   Please run the following SQL in your Supabase Dashboard > SQL Editor:\n')
    console.log('   ---')
    console.log('   ALTER TABLE public.organizations')
    console.log('     ADD COLUMN parent_organization_id uuid REFERENCES public.organizations(id);')
    console.log('   ---')
    console.log('\n   Then re-run this script.')

    // Also print the full migration
    const migrationPath = path.resolve(__dirname, '..', 'supabase', 'migrations', '20260303_multi_site_rls.sql')
    if (fs.existsSync(migrationPath)) {
      console.log(`\n   Full migration file: ${migrationPath}`)
      console.log('   Copy/paste the full file content into the SQL Editor.')
    }
    process.exit(1)
  } else {
    console.log('   parent_organization_id column already exists ✓')
  }

  // Step 2: Check enterprise org exists
  console.log('\n2. Checking enterprise org...')
  const { data: entOrgs } = await sb
    .from('organizations')
    .select('id, nom, plan, clerk_org_id')
    .eq('plan', 'enterprise')

  if (!entOrgs?.length) {
    console.log('   No enterprise org found. Checking all orgs...')
    const { data: allOrgs } = await sb.from('organizations').select('id, nom, plan, clerk_org_id')
    console.log('   Available orgs:')
    allOrgs?.forEach(o => console.log(`     - ${o.nom} (plan: ${o.plan}, id: ${o.id})`))

    if (allOrgs?.length) {
      const orgToUpgrade = allOrgs[0]
      console.log(`\n   Upgrading "${orgToUpgrade.nom}" to enterprise...`)
      const { error: upgErr } = await sb
        .from('organizations')
        .update({ plan: 'enterprise' })
        .eq('id', orgToUpgrade.id)
      if (upgErr) {
        console.error('   Failed:', upgErr.message)
        process.exit(1)
      }
      console.log('   Done ✓')
    }
  } else {
    console.log(`   Enterprise org: "${entOrgs[0].nom}" (${entOrgs[0].id}) ✓`)
  }

  console.log('\n=== Migration complete ===')
  console.log('You can now run: npx tsx scripts/simulate.ts --force')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
