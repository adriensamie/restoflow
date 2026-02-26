import { z } from 'zod'

export const creerProduitSchema = z.object({
  nom: z.string().min(1).max(200),
  categorie: z.string().min(1).max(100),
  unite: z.string().min(1).max(50),
  prix_unitaire: z.number().min(0).optional(),
  seuil_alerte: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
})

export const modifierProduitSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  categorie: z.string().min(1).max(100).optional(),
  unite: z.string().min(1).max(50).optional(),
  prix_unitaire: z.number().min(0).optional(),
  seuil_alerte: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
})

export const ajouterMouvementSchema = z.object({
  produit_id: z.string().uuid(),
  type: z.enum(['entree', 'sortie', 'perte', 'inventaire']),
  quantite: z.number().positive(),
  prix_unitaire: z.number().min(0).optional(),
  motif: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
})

export const ligneInventaireSchema = z.object({
  produit_id: z.string().uuid(),
  quantite_reelle: z.number().min(0),
  prix_unitaire: z.number().min(0).optional(),
})
