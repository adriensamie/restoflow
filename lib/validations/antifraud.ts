import { z } from 'zod'

export const configCaisseSchema = z.object({
  source: z.string().min(1).max(100),
  api_key: z.string().max(500).optional(),
  webhook_secret: z.string().max(500).optional(),
  api_endpoint: z.string().url().max(500).optional().or(z.literal('')),
  seuil_alerte_annulation: z.number().min(0).max(100000).optional(),
  alertes_actives: z.boolean().optional(),
})

export const eventManuelSchema = z.object({
  event_type: z.enum([
    'paiement', 'ouverture_ticket', 'annulation_ticket',
    'remise', 'ouverture_caisse', 'correction', 'offert',
  ]),
  montant: z.number().min(0).max(1000000),
  mode_paiement: z.enum(['especes', 'cb', 'ticket_resto', 'autre']).optional(),
  employe_nom: z.string().max(200).optional(),
  nb_couverts: z.number().int().min(0).max(10000).optional(),
  motif: z.string().max(500).optional(),
  service: z.string().max(100).optional(),
})
