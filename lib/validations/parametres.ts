import { z } from 'zod'

export const sauvegarderParametresSchema = z.object({
  nom: z.string().min(1).max(200),
  adresse: z.string().max(500).optional(),
  telephone: z.string().max(30).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  siret: z.string().max(20).optional(),
  tva_intracom: z.string().max(20).optional(),
  taux_tva_defaut: z.number().min(0).max(100).optional(),
  objectif_food_cost: z.number().min(0).max(100).optional(),
  timezone: z.string().max(100).optional(),
  devise: z.string().max(10).optional(),
  nb_couverts_moyen: z.number().int().min(0).max(10000).optional(),
})
