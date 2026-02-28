import { z } from 'zod'

export const sauvegarderObjectifsSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}$/),
  food_cost_cible: z.number().min(0).max(100),
  masse_salariale_cible: z.number().min(0).max(100),
  marge_nette_cible: z.number().min(-100).max(100),
  ca_cible: z.number().min(0).optional(),
})

export const sauvegarderSnapshotSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}$/),
  ca_total: z.number().min(0),
  cout_matieres: z.number().min(0),
  masse_salariale: z.number().min(0),
  nb_couverts: z.number().int().min(0).optional(),
  source: z.string().max(100).optional(),
})
