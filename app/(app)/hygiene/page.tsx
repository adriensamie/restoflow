import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { HaccpClient } from '@/components/haccp/haccp-client'

export default async function HygienePage() {
  const supabase = await createServerSupabaseClient()
  const { orgId } = await auth()

  const { data: org } = await (supabase as any)
    .from('organizations').select('id').eq('clerk_org_id', orgId).single()
  const orgUUID = org?.id

  const aujourd = new Date()
  const debut7j = new Date(aujourd)
  debut7j.setDate(aujourd.getDate() - 7)

  const [{ data: templates }, { data: releves }] = await Promise.all([
    (supabase as any)
      .from('haccp_templates')
      .select('*')
      .eq('organization_id', orgUUID)
      .eq('actif', true)
      .order('ordre'),
    (supabase as any)
      .from('haccp_releves')
      .select('*')
      .eq('organization_id', orgUUID)
      .gte('releve_at', debut7j.toISOString())
      .order('releve_at', { ascending: false })
      .limit(200),
  ])

  return (
    <HaccpClient
      templates={templates ?? []}
      releves={releves ?? []}
    />
  )
}
