import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = {}
readFileSync('.env.local','utf-8').split('\n').forEach(l => {
  const t = l.trim()
  if (t === '' || t.startsWith('#')) return
  const eq = t.indexOf('=')
  if (eq < 0) return
  env[t.slice(0,eq).trim()] = t.slice(eq+1).trim().replace(/^["']|["']$/g,'')
})
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb.from('organizations').select('id, nom, clerk_org_id, plan')
console.log(JSON.stringify(data, null, 2))
process.exit(0)
