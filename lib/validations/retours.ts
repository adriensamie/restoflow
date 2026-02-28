import { z } from 'zod'

export const creerRetourSchema = z.object({
  commande_id: z.string().uuid(),
  fournisseur_id: z.string().uuid(),
  lignes: z.array(z.object({
    produit_id: z.string().uuid(),
    quantite_retournee: z.number().positive(),
    prix_unitaire: z.number().min(0).optional(),
    motif: z.string().max(500).optional(),
  })).min(1),
})

export const majStatutRetourSchema = z.object({
  retour_id: z.string().uuid(),
  statut: z.enum(['envoye', 'accepte', 'refuse', 'rembourse']),
})
