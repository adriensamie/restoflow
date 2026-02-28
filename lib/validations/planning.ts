import { z } from 'zod'

export const creerEmployeSchema = z.object({
  prenom: z.string().min(1).max(100),
  nom: z.string().min(1).max(100),
  poste: z.string().min(1).max(50),
  email: z.string().email().optional(),
  telephone: z.string().max(30).optional(),
  couleur: z.string().max(20).optional(),
  taux_horaire: z.number().min(0).optional(),
  heures_contrat: z.number().min(0).max(60).optional(),
})

export const modifierEmployeSchema = creerEmployeSchema.partial()

export const creerCreneauSchema = z.object({
  employe_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  poste: z.string().max(50).optional(),
  service: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
})

export const modifierStatutCreneauSchema = z.object({
  statut: z.enum(['planifie', 'confirme', 'annule', 'effectue']),
})

export const dupliquerSemaineSchema = z.object({
  dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  offsetJours: z.number().int().min(1).max(365),
})
