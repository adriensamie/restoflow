import { z } from 'zod'

export const sauvegarderPrevisionSchema = z.object({
  date_prevision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  couverts_midi: z.number().int().min(0).max(10000).optional(),
  couverts_soir: z.number().int().min(0).max(10000).optional(),
  ca_prevu: z.number().min(0).max(10000000).optional(),
  meteo_condition: z.string().max(100).optional(),
  meteo_temperature: z.number().min(-50).max(60).optional(),
  est_ferie: z.boolean().optional(),
  est_vacances: z.boolean().optional(),
  evenement_local: z.string().max(200).optional(),
  confiance: z.enum(['basse', 'moyenne', 'haute']).optional(),
  produits_prioritaires: z.array(z.any()).optional(),
})

export const sauvegarderReelSchema = z.object({
  date_prevision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  couverts_reel_midi: z.number().int().min(0).max(10000).optional(),
  couverts_reel_soir: z.number().int().min(0).max(10000).optional(),
  ca_reel: z.number().min(0).max(10000000).optional(),
})
