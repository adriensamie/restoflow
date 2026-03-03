import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { withRateLimit } from '@/lib/api-rate-limit'

// Webhook universel — reçoit les événements de toutes les caisses
// URL : https://restoflow.fr/api/caisse/webhook?org=ORGANIZATION_ID

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface CaissePayload {
  type?: string
  event?: string
  amount?: number
  total?: number
  total_price?: number
  discount_amount?: number
  montant?: number
  payment_method?: string
  payment_type?: string
  mode_paiement?: string
  cashier_name?: string
  employee?: string
  employee_name?: string
  employe_nom?: string
  covers?: number
  guests_count?: number
  nb_couverts?: number
  reason?: string
  comment?: string
  cancellation_reason?: string
  motif?: string
  items?: unknown[] | null
  articles?: unknown[] | null
  id?: string
  ticket_id?: string
  order_id?: string
  terminal_id?: string
  pos_id?: string
  device_id?: string
  created_at?: string
  timestamp?: string
  date?: string
  event_at?: string
  event_type?: string
}

interface NormalisedEvent {
  event_type: string
  montant: number
  mode_paiement: string | null
  employe_nom: string | null
  nb_couverts: number | null
  motif: string | null
  articles: unknown[] | null
  source_id: string | null
  terminal_id: string | null
  event_at: string
}

function normaliserEvent(source: string, payload: CaissePayload): NormalisedEvent {
  switch (source) {
    case '6xpos':
      return {
        event_type: mapType6xpos(payload.type),
        montant: payload.amount || payload.total || 0,
        mode_paiement: mapPaiement(payload.payment_method),
        employe_nom: payload.cashier_name || payload.employee || null,
        nb_couverts: payload.covers ?? null,
        motif: payload.reason || payload.comment || null,
        articles: payload.items || null,
        source_id: payload.id || payload.ticket_id || null,
        terminal_id: payload.terminal_id || payload.pos_id || null,
        event_at: payload.created_at || payload.timestamp || new Date().toISOString(),
      }
    case 'zelty':
      return {
        event_type: mapTypeZelty(payload.event),
        montant: payload.total_price || payload.discount_amount || 0,
        mode_paiement: mapPaiement(payload.payment_type),
        employe_nom: payload.employee_name || null,
        nb_couverts: payload.guests_count ?? null,
        motif: payload.cancellation_reason || null,
        articles: payload.items || null,
        source_id: payload.order_id || null,
        terminal_id: payload.device_id || null,
        event_at: payload.date || new Date().toISOString(),
      }
    default:
      return {
        event_type: payload.event_type || 'paiement',
        montant: payload.montant || payload.amount || 0,
        mode_paiement: payload.mode_paiement ?? null,
        employe_nom: payload.employe_nom || payload.employee || null,
        nb_couverts: payload.nb_couverts ?? null,
        motif: payload.motif || null,
        articles: payload.articles || null,
        source_id: payload.id || null,
        terminal_id: payload.terminal_id || null,
        event_at: payload.event_at || new Date().toISOString(),
      }
  }
}

function mapType6xpos(type: string | undefined): string {
  const map: Record<string, string> = {
    'ORDER_CREATED': 'ouverture_ticket',
    'ORDER_CANCELLED': 'annulation_ticket',
    'DISCOUNT_APPLIED': 'remise',
    'PAYMENT': 'paiement',
    'DRAWER_OPEN': 'ouverture_caisse',
    'VOID': 'correction',
    'COMPLIMENTARY': 'offert',
  }
  return (type && map[type]) || 'paiement'
}

function mapTypeZelty(event: string | undefined): string {
  const map: Record<string, string> = {
    'order.created': 'ouverture_ticket',
    'order.cancelled': 'annulation_ticket',
    'order.discount': 'remise',
    'payment.success': 'paiement',
    'order.void': 'correction',
    'order.complimentary': 'offert',
  }
  return (event && map[event]) || 'paiement'
}

function mapPaiement(type: string | undefined): string | null {
  if (!type) return null
  const t = type.toLowerCase()
  if (t.includes('cash') || t.includes('espece')) return 'especes'
  if (t.includes('card') || t.includes('cb') || t.includes('carte')) return 'cb'
  if (t.includes('ticket') || t.includes('tr') || t.includes('swile')) return 'ticket_resto'
  return 'autre'
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const orgId = req.nextUrl.searchParams.get('org')
    const source = req.nextUrl.searchParams.get('source') || 'manuel'
    if (!orgId || !UUID_REGEX.test(orgId)) {
      return NextResponse.json({ error: 'org manquant ou invalide' }, { status: 400 })
    }

    const { data: config } = await supabase
      .from('config_caisse')
      .select('webhook_secret, seuil_alerte_annulation')
      .eq('organization_id', orgId)
      .single()

    // Require webhook_secret to be configured — refuse unsigned requests
    if (!config?.webhook_secret) {
      return NextResponse.json({ error: 'Webhook non configure pour cette organisation' }, { status: 403 })
    }

    const body = await req.text()

    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 401 })
    }
    const expected = crypto
      .createHmac('sha256', config.webhook_secret)
      .update(body).digest('hex')
    if (signature !== expected && signature !== `sha256=${expected}`) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    const payload = (() => { try { return JSON.parse(body) } catch { return {} } })()
    const events = Array.isArray(payload) ? payload : [payload]

    const toInsert = events.map(e => ({
      organization_id: orgId,
      source,
      ...normaliserEvent(source, e),
    }))

    const { error } = await supabase.from('events_caisse').insert(toInsert)
    if (error) throw new Error(error.message)

    await supabase.from('config_caisse')
      .update({ derniere_sync: new Date().toISOString(), statut_connexion: 'connecte' })
      .eq('organization_id', orgId)

    // Check for suspicious cancellations and create notification
    const cancellations = toInsert.filter(e =>
      e.event_type === 'annulation_ticket' || e.event_type === 'correction'
    )
    if (cancellations.length > 0) {
      const totalMontant = cancellations.reduce((a: number, e) => a + (e.montant || 0), 0)
      const seuil = config?.seuil_alerte_annulation ?? 50
      if (totalMontant >= seuil) {
        try {
          await supabase.from('notifications').insert({
            organization_id: orgId,
            type: 'annulation_suspecte',
            titre: `Annulation suspecte : ${totalMontant} EUR`,
            message: `${cancellations.length} annulation(s) pour un total de ${totalMontant} EUR`,
            lue: false,
            canal: ['in_app', 'web_push'],
          })
        } catch {}
      }
    }

    return NextResponse.json({ success: true, inserted: toInsert.length })
  } catch (e: unknown) {
    console.error('Webhook caisse error:', e)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}, { maxRequests: 60, windowMs: 60 * 1000, prefix: 'webhook-caisse' })