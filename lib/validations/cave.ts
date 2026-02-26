import { z } from 'zod'

export const creerVinSchema = z.object({
  nom: z.string().min(1).max(200),
  appellation: z.string().max(200).optional(),
  categorie: z.string().min(1).max(100),
  zone: z.string().min(1).max(100),
  fournisseur_id: z.string().uuid().optional(),
  prix_achat_ht: z.number().min(0).optional(),
  prix_vente_ttc: z.number().min(0).optional(),
  vendu_au_verre: z.boolean().optional(),
  prix_verre_ttc: z.number().min(0).optional(),
  contenance_verre: z.number().min(0).optional(),
  stock_bouteilles: z.number().int().min(0).optional(),
  seuil_alerte: z.number().int().min(0).optional(),
})

export const mouvementCaveSchema = z.object({
  vin_id: z.string().uuid(),
  type: z.enum(['entree', 'sortie_bouteille', 'casse', 'inventaire']),
  quantite: z.number().positive(),
  prix_unitaire: z.number().min(0).optional(),
  note: z.string().max(500).optional(),
})
