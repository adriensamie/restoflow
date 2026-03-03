'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrgUUID } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { creerFournisseurSchema, modifierFournisseurSchema, lierProduitFournisseurSchema, creerCommandeSchema, modifierCommandeSchema, receptionnerLivraisonSchema } from '@/lib/validations/commandes'
import { createNotification } from '@/lib/notifications'
import { requireRole } from '@/lib/rbac'

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export async function creerFournisseur(data: {
  nom: string
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  adresse?: string
  delai_livraison?: number
  conditions_paiement?: string
}) {
  const validated = creerFournisseurSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { data: result, error } = await supabase
    .from('fournisseurs').insert({ ...validated, organization_id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
  return result
}

export async function modifierFournisseur(id: string, data: {
  nom?: string
  contact_nom?: string
  contact_email?: string
  contact_telephone?: string
  adresse?: string
  delai_livraison?: number
  conditions_paiement?: string
}) {
  const validated = modifierFournisseurSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('fournisseurs').update(validated).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
}

export async function lierProduitFournisseur(data: {
  produit_id: string
  fournisseur_id: string
  reference?: string
  prix_negocie?: number
  unite_commande?: string
  qte_min?: number
  fournisseur_principal?: boolean
}) {
  const validated = lierProduitFournisseurSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('produit_fournisseur').upsert({ ...validated, organization_id }, { onConflict: 'produit_id,fournisseur_id' })
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
  revalidatePath('/stocks')
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export async function creerCommande(data: {
  fournisseur_id: string
  date_livraison_prevue?: string
  note?: string
  lignes: { produit_id: string; quantite_commandee: number; prix_unitaire?: number }[]
}) {
  const validated = creerCommandeSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Numéro auto : CMD-YYYYMMDD-XXXXXX
  const numero = `CMD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900000 + 100000)}`

  const totalHt = validated.lignes.reduce((acc, l) => acc + l.quantite_commandee * (l.prix_unitaire ?? 0), 0)

  const { data: commande, error } = await supabase
    .from('commandes')
    .insert({
      fournisseur_id: validated.fournisseur_id,
      organization_id,
      numero,
      date_livraison_prevue: validated.date_livraison_prevue,
      note: validated.note,
      total_ht: totalHt,
      statut: 'brouillon',
    })
    .select().single()

  if (error) throw new Error(error.message)

  const lignes = validated.lignes.map(l => ({
    commande_id: commande.id,
    produit_id: l.produit_id,
    quantite_commandee: l.quantite_commandee,
    prix_unitaire: l.prix_unitaire,
  }))

  const { error: lignesError } = await supabase
    .from('commande_lignes').insert(lignes)
  if (lignesError) throw new Error(lignesError.message)

  revalidatePath('/commandes')
  return commande
}

export async function modifierCommande(data: {
  commande_id: string
  fournisseur_id: string
  date_livraison_prevue?: string
  note?: string
  lignes: { produit_id: string; quantite_commandee: number; prix_unitaire?: number }[]
}) {
  const validated = modifierCommandeSchema.parse(data)
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // Verify commande belongs to org and is still a brouillon
  const { data: commande, error: cmdErr } = await supabase
    .from('commandes')
    .select('id, statut')
    .eq('id', validated.commande_id)
    .eq('organization_id', organization_id)
    .single()

  if (cmdErr || !commande) throw new Error('Commande introuvable')
  if (commande.statut !== 'brouillon') throw new Error('Seul un brouillon peut etre modifie')

  // Delete existing lines
  const { error: delErr } = await supabase
    .from('commande_lignes')
    .delete()
    .eq('commande_id', validated.commande_id)
  if (delErr) throw new Error(delErr.message)

  // Recalculate total
  const totalHt = validated.lignes.reduce(
    (acc, l) => acc + l.quantite_commandee * (l.prix_unitaire ?? 0), 0
  )

  // Update commande header
  const { error: updErr } = await supabase
    .from('commandes')
    .update({
      fournisseur_id: validated.fournisseur_id,
      date_livraison_prevue: validated.date_livraison_prevue,
      note: validated.note,
      total_ht: totalHt,
    })
    .eq('id', validated.commande_id)
    .eq('organization_id', organization_id)
  if (updErr) throw new Error(updErr.message)

  // Insert new lines
  const lignes = validated.lignes.map(l => ({
    commande_id: validated.commande_id,
    produit_id: l.produit_id,
    quantite_commandee: l.quantite_commandee,
    prix_unitaire: l.prix_unitaire,
  }))

  const { error: lignesError } = await supabase
    .from('commande_lignes').insert(lignes)
  if (lignesError) throw new Error(lignesError.message)

  revalidatePath('/commandes')
}

export async function envoyerCommande(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  const { error } = await supabase
    .from('commandes').update({ statut: 'envoyee' }).eq('id', id).eq('organization_id', organization_id)
  if (error) throw new Error(error.message)

  revalidatePath('/commandes')

  // Fire-and-forget: email PDF to fournisseur (don't block response)
  ;(async () => {
    try {
      const { data: commande } = await supabase
        .from('commandes')
        .select('*, fournisseurs(nom, contact_email, adresse)')
        .eq('id', id)
        .single()

      if (!commande?.fournisseurs?.contact_email) return

      const [{ data: lignes }, { data: org }] = await Promise.all([
        supabase.from('commande_lignes').select('*, produits(nom, unite)').eq('commande_id', id),
        supabase.from('organizations').select('nom, adresse').eq('id', organization_id).single(),
      ])

      if (!lignes || !org) return

      const { generateBonCommandePDF } = await import('@/lib/pdf/bon-commande')
      const pdfBytes = generateBonCommandePDF({
        numero: commande.numero,
        date: new Date().toLocaleDateString('fr-FR'),
        date_livraison_prevue: commande.date_livraison_prevue
          ? new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')
          : null,
        fournisseur: {
          nom: commande.fournisseurs.nom,
          adresse: commande.fournisseurs.adresse,
          contact_email: commande.fournisseurs.contact_email,
        },
        organisation: { nom: org.nom, adresse: org.adresse },
        lignes: lignes.map((l: { produits: { nom: string; unite: string } | null; quantite_commandee: number; prix_unitaire: number | null }) => ({
          produit_nom: l.produits?.nom ?? 'Produit',
          unite: l.produits?.unite ?? '',
          quantite: l.quantite_commandee,
          prix_unitaire: l.prix_unitaire ?? 0,
        })),
        total_ht: commande.total_ht ?? 0,
        note: commande.note,
      })

      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'RestoFlow <commandes@restoflow.app>',
        to: commande.fournisseurs.contact_email,
        subject: `Bon de commande ${commande.numero} — ${org.nom}`,
        text: `Veuillez trouver ci-joint le bon de commande ${commande.numero}.\n\nCordialement,\n${org.nom}`,
        attachments: [{
          filename: `${commande.numero}.pdf`,
          content: Buffer.from(pdfBytes).toString('base64'),
        }],
      })
    } catch (emailErr) {
      console.error('[envoyerCommande] Email error:', emailErr)
    }
  })()
}

// ─── Réception livraison ─────────────────────────────────────────────────────

export async function receptionnerLivraison(
  commandeId: string,
  lignes: { ligne_id: string; produit_id: string; quantite_commandee: number; quantite_recue: number; prix_unitaire?: number; note_ecart?: string }[]
) {
  const validated = receptionnerLivraisonSchema.parse({ commandeId, lignes })
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()

  // 0. Vérifier que la commande appartient bien à cette organisation
  const { data: commande, error: cmdCheckError } = await supabase
    .from('commandes').select('id').eq('id', validated.commandeId).eq('organization_id', organization_id).single()
  if (cmdCheckError || !commande) throw new Error('Commande introuvable')

  // 1. Batch: mettre à jour toutes les lignes en parallèle
  const ligneUpdates = validated.lignes.map(ligne =>
    supabase.from('commande_lignes')
      .update({ quantite_recue: ligne.quantite_recue, note_ecart: ligne.note_ecart })
      .eq('id', ligne.ligne_id)
      .eq('commande_id', validated.commandeId)
  )

  // 2. Batch: insérer tous les mouvements stock en une seule requête
  const mouvements = validated.lignes
    .filter(l => l.quantite_recue > 0)
    .map(l => ({
      produit_id: l.produit_id,
      organization_id,
      type: 'entree' as const,
      quantite: l.quantite_recue,
      prix_unitaire: l.prix_unitaire,
      motif: 'Livraison commande',
      note: l.note_ecart || null,
    }))

  // 3. Statut
  const toutRecu = validated.lignes.every(l => l.quantite_recue >= l.quantite_commandee)
  const statut = toutRecu ? 'recue' : 'recue_partielle'

  // Execute lignes + mouvements + statut in parallel
  const [ligneResults, mvtResult, cmdResult] = await Promise.all([
    Promise.all(ligneUpdates),
    mouvements.length > 0
      ? supabase.from('mouvements_stock').insert(mouvements)
      : Promise.resolve({ error: null }),
    supabase.from('commandes')
      .update({ statut, date_livraison_reelle: new Date().toISOString().slice(0, 10) })
      .eq('id', validated.commandeId)
      .eq('organization_id', organization_id),
  ])

  // Check for errors
  const ligneError = ligneResults.find(r => r.error)?.error
  if (ligneError) throw new Error(ligneError.message)
  if (mvtResult.error) throw new Error(mvtResult.error.message)
  if (cmdResult.error) throw new Error(cmdResult.error.message)

  // Écarts pour le client
  const ecarts = validated.lignes.filter(l => {
    const pct = l.quantite_commandee > 0
      ? Math.abs(l.quantite_recue - l.quantite_commandee) / l.quantite_commandee * 100
      : 0
    return pct > 5
  })

  // 4. Price tracking — batch: une seule requête pour tous les prix actuels
  const lignesAvecPrix = validated.lignes.filter(l => l.prix_unitaire != null && l.prix_unitaire! > 0)
  if (lignesAvecPrix.length > 0) {
    const produitIds = lignesAvecPrix.map(l => l.produit_id)
    const { data: produitsActuels } = await supabase
      .from('produits')
      .select('id, prix_unitaire')
      .in('id', produitIds)
      .eq('organization_id', organization_id)

    const prixMap = new Map((produitsActuels ?? []).map(p => [p.id, p.prix_unitaire]))
    const today = new Date().toISOString().slice(0, 10)

    // Batch insert price histories
    const histories = lignesAvecPrix.map(l => {
      const prixPrecedent = prixMap.get(l.produit_id) ?? null
      const variationPct = prixPrecedent && prixPrecedent > 0
        ? ((l.prix_unitaire! - prixPrecedent) / prixPrecedent) * 100
        : null
      return {
        organization_id,
        produit_id: l.produit_id,
        prix: l.prix_unitaire!,
        prix_precedent: prixPrecedent,
        variation_pct: variationPct ? Math.round(variationPct * 100) / 100 : null,
        source: 'reception_bl' as const,
        commande_id: validated.commandeId,
        date_releve: today,
      }
    })

    // Batch update product prices + insert histories in parallel
    await Promise.all([
      supabase.from('prix_produit_historique').insert(histories),
      ...lignesAvecPrix.map(l =>
        supabase.from('produits')
          .update({ prix_unitaire: l.prix_unitaire })
          .eq('id', l.produit_id)
          .eq('organization_id', organization_id)
      ),
    ])

    // Fire-and-forget: price alerts (don't block response)
    const alertes = lignesAvecPrix.filter(l => {
      const prev = prixMap.get(l.produit_id)
      return prev && prev > 0 && ((l.prix_unitaire! - prev) / prev) * 100 > 10
    })
    if (alertes.length > 0) {
      Promise.all(alertes.map(l => {
        const prev = prixMap.get(l.produit_id)!
        const pct = ((l.prix_unitaire! - prev) / prev) * 100
        return createNotification({
          organizationId: organization_id,
          type: 'hausse_prix',
          titre: `Hausse de prix > 10%`,
          message: `+${pct.toFixed(1)}% sur un produit (${prev.toFixed(2)} → ${l.prix_unitaire!.toFixed(2)} EUR)`,
          canal: ['in_app', 'web_push'],
        }).catch(() => {})
      })).catch(() => {})
    }
  }

  // Fire-and-forget: notification écarts (don't block response)
  if (ecarts.length > 0) {
    createNotification({
      organizationId: organization_id,
      type: 'ecart_livraison',
      titre: `${ecarts.length} ecart(s) de livraison`,
      message: `Commande ${validated.commandeId} : ${ecarts.length} produit(s) avec ecart > 5%`,
      canal: ['in_app', 'web_push'],
    }).catch(() => {})
  }

  revalidatePath('/commandes')

  return { statut, ecarts }
}
export async function supprimerFournisseur(id: string) {
  await requireRole(['patron', 'manager'])
  const supabase = await createServerSupabaseClient()
  const organization_id = await getOrgUUID()
  const { error } = await supabase
    .from('fournisseurs')
    .update({ actif: false })
    .eq('id', id)
    .eq('organization_id', organization_id)
  if (error) throw new Error(error.message)
  revalidatePath('/fournisseurs')
}
