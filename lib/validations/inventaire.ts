import { z } from 'zod'

export const creerSessionSchema = z.object({
  nom: z.string().min(1).max(200),
  zone: z.string().min(1).max(100),
  note: z.string().max(500).optional(),
})

export const ligneInventaireSessionSchema = z.object({
  session_id: z.string().uuid(),
  produit_id: z.string().uuid().optional(),
  vin_id: z.string().uuid().optional(),
  stock_theorique: z.number().min(0),
  quantite_comptee: z.number().min(0),
  unite: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
})
