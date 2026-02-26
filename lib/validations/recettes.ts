import { z } from 'zod'

export const creerRecetteSchema = z.object({
  nom: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  prix_vente_ttc: z.number().min(0).optional(),
  pourcentage_ficelles: z.number().min(0).max(100).optional(),
  nb_portions: z.number().int().positive().optional(),
  allergenes: z.array(z.string()).optional(),
  importe_ia: z.boolean().optional(),
})

export const ajouterIngredientSchema = z.object({
  recette_id: z.string().uuid(),
  produit_id: z.string().uuid().optional(),
  vin_id: z.string().uuid().optional(),
  quantite: z.number().positive(),
  unite: z.string().min(1).max(50),
  cout_unitaire: z.number().min(0).optional(),
  ordre: z.number().int().min(0).optional(),
})
