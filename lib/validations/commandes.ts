import { z } from 'zod'

export const creerFournisseurSchema = z.object({
  nom: z.string().min(1).max(200),
  contact_nom: z.string().max(200).optional(),
  contact_email: z.string().email().optional(),
  contact_telephone: z.string().max(30).optional(),
  adresse: z.string().max(500).optional(),
  delai_livraison: z.number().int().min(0).optional(),
  conditions_paiement: z.string().max(200).optional(),
})

export const modifierFournisseurSchema = creerFournisseurSchema.partial()

export const creerCommandeSchema = z.object({
  fournisseur_id: z.string().uuid(),
  date_livraison_prevue: z.string().optional(),
  note: z.string().max(500).optional(),
  lignes: z.array(z.object({
    produit_id: z.string().uuid(),
    quantite_commandee: z.number().positive(),
    prix_unitaire: z.number().min(0).optional(),
  })).min(1),
})

export const lierProduitFournisseurSchema = z.object({
  produit_id: z.string().uuid(),
  fournisseur_id: z.string().uuid(),
  reference: z.string().max(200).optional(),
  prix_negocie: z.number().min(0).optional(),
  unite_commande: z.string().max(50).optional(),
  qte_min: z.number().min(0).optional(),
  fournisseur_principal: z.boolean().optional(),
})

export const receptionnerLivraisonSchema = z.object({
  commandeId: z.string().uuid(),
  lignes: z.array(z.object({
    ligne_id: z.string().uuid(),
    produit_id: z.string().uuid(),
    quantite_commandee: z.number().min(0),
    quantite_recue: z.number().min(0),
    prix_unitaire: z.number().min(0).optional(),
    note_ecart: z.string().max(500).optional(),
  })).min(1),
})
