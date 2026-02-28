import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/safe-error'

// Vercel cron — runs daily at 8:00 AM
// vercel.json: { "crons": [{ "path": "/api/cron/digest-email", "schedule": "0 8 * * *" }] }

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

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

    // Get unread notifications from last 24h grouped by org + staff
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: notifications } = await supabase
      .from('notifications')
      .select('organization_id, staff_id, titre, message, type, created_at')
      .eq('lue', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    // Group by org+staff
    const groups = new Map<string, typeof notifications>()
    for (const n of notifications) {
      const key = `${n.organization_id}::${n.staff_id ?? 'all'}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(n)
    }

    let sent = 0

    for (const [key, notifs] of groups) {
      const [orgId, staffId] = key.split('::')

      // Get staff email (if specific staff)
      let email: string | null = null
      if (staffId !== 'all') {
        const { data: staff } = await supabase
          .from('staff')
          .select('email')
          .eq('id', staffId)
          .single()
        email = staff?.email ?? null
      }

      // Fallback to org email
      if (!email) {
        const { data: org } = await supabase
          .from('organizations')
          .select('email_contact')
          .eq('id', orgId)
          .single()
        email = org?.email_contact ?? null
      }

      if (!email) continue

      // Check preferences allow email
      if (staffId !== 'all') {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('email')
          .eq('organization_id', orgId)
          .eq('staff_id', staffId)
          .limit(1)

        const anyEmail = prefs?.some((p: any) => p.email) ?? true
        if (!anyEmail) continue
      }

      const listHtml = notifs.map(n =>
        `<li><strong>${escapeHtml(n.titre)}</strong>: ${escapeHtml(n.message)} <em>(${new Date(n.created_at).toLocaleTimeString('fr-FR')})</em></li>`
      ).join('')

      await getResend().emails.send({
        from: 'RestoFlow <noreply@restoflow.fr>',
        to: email,
        subject: `RestoFlow — ${notifs.length} notification${notifs.length > 1 ? 's' : ''} non lue${notifs.length > 1 ? 's' : ''}`,
        html: `<h2>Recap des dernieres 24h</h2><ul>${listHtml}</ul><p><a href="https://app.restoflow.fr/alertes">Voir les alertes</a></p>`,
      })
      sent++
    }

    return NextResponse.json({ sent })
  } catch (e: any) {
    console.error('CRON digest-email error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
