'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { receptionnerLivraison, envoyerCommande } from '@/lib/actions/commandes'
import { RetourModal } from '@/components/commandes/retour-modal'

interface Ligne {
  id: string
  produit_id: string
  quantite_commandee: number
  prix_unitaire: number | null
  quantite_recue: number | null
  note_ecart: string | null
  produits: { nom: string; unite: string; categorie: string } | null
}

interface Props {
  commande: {
    id: string; numero: string; statut: string; note: string | null
    date_livraison_prevue: string | null; total_ht: number | null
    fournisseur_id: string
    fournisseurs: { nom: string; contact_telephone: string | null; contact_email: string | null } | null
  }
  lignes: Ligne[]
}

export function ReceptionClient({ commande, lignes }: Props) {
  const [isPending, startTransition] = useTransition()
  const [quantitesRecues, setQuantitesRecues] = useState<Record<string, number>>(
    Object.fromEntries(lignes.map(l => [l.id, l.quantite_commandee]))
  )
  const [notesEcart, setNotesEcart] = useState<Record<string, string>>({})
  const [ecarts, setEcarts] = useState<any[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRetourModal, setShowRetourModal] = useState(false)

  const dejaRecu = ['recue', 'recue_partielle', 'annulee'].includes(commande.statut)

  const getEcartPct = (ligneId: string, qteCommandee: number) => {
    const qteRecue = quantitesRecues[ligneId] ?? qteCommandee
    return qteCommandee > 0 ? (qteRecue - qteCommandee) / qteCommandee * 100 : 0
  }

  const handleReceptionner = () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await receptionnerLivraison(
          commande.id,
          lignes.map(l => ({
            ligne_id: l.id,
            produit_id: l.produit_id,
            quantite_commandee: l.quantite_commandee,
            quantite_recue: quantitesRecues[l.id] ?? l.quantite_commandee,
            prix_unitaire: l.prix_unitaire ?? undefined,
            note_ecart: notesEcart[l.id] || undefined,
          }))
        )
        setEcarts(result?.ecarts ?? [])
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors de la réception')
      }
    })
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto space-y-6 pt-8">
        <div className="rounded-2xl p-8 text-center space-y-4"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <CheckCircle size={48} className="mx-auto" style={{ color: '#4ade80' }} />
          <h2 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Livraison réceptionnée !</h2>
          <p className="text-sm" style={{ color: '#4a6fa5' }}>
            Les stocks ont été mis à jour automatiquement.
          </p>
          {ecarts.length > 0 && (
            <div className="rounded-lg p-4 text-left space-y-3"
              style={{ background: '#2d1500', border: '1px solid #92400e' }}>
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
                <AlertTriangle size={14} className="inline mr-1" />
                {ecarts.length} écart{ecarts.length > 1 ? 's' : ''} détecté{ecarts.length > 1 ? 's' : ''} (&gt;5%)
              </p>
              <button onClick={() => setShowRetourModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)' }}>
                <RotateCcw size={14} />
                Creer un bon de retour
              </button>
            </div>
          )}
          <Link href="/commandes"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            Retour aux commandes
          </Link>
        </div>

        {showRetourModal && (
          <RetourModal
            commandeId={commande.id}
            fournisseurId={commande.fournisseur_id}
            fournisseurEmail={commande.fournisseurs?.contact_email ?? null}
            ecarts={ecarts.map(e => {
              const ligne = lignes.find(l => l.id === e.ligne_id)
              return {
                ligne_id: e.ligne_id,
                produit_id: e.produit_id,
                produit_nom: ligne?.produits?.nom ?? 'Produit',
                unite: ligne?.produits?.unite ?? '',
                quantite_commandee: e.quantite_commandee,
                quantite_recue: e.quantite_recue,
                prix_unitaire: e.prix_unitaire,
                note_ecart: e.note_ecart,
              }
            })}
            onClose={() => setShowRetourModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/commandes" className="p-2 rounded-lg transition-all"
          style={{ color: '#4a6fa5', background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
            Réception — {commande.numero}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#4a6fa5' }}>
            {commande.fournisseurs?.nom} · {commande.date_livraison_prevue
              ? `Prévue le ${new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}`
              : 'Date non définie'}
          </p>
        </div>
      </div>

      {/* Tableau réception */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1e2d4a' }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold uppercase"
          style={{ background: '#0a1628', color: '#3b5280' }}>
          <span className="col-span-3">Produit</span>
          <span className="col-span-2">Commandé</span>
          <span className="col-span-3">Reçu</span>
          <span className="col-span-2">Écart</span>
          <span className="col-span-2">Note écart</span>
        </div>

        {lignes.map((ligne, i) => {
          const ecartPct = getEcartPct(ligne.id, ligne.quantite_commandee)
          const hasEcart = Math.abs(ecartPct) > 5
          const ecartColor = ecartPct > 5 ? '#4ade80' : ecartPct < -5 ? '#f87171' : '#4a6fa5'

          return (
            <div key={ligne.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
              style={{
                background: hasEcart ? (ecartPct < 0 ? '#1a0505' : '#051a0a') : i % 2 === 0 ? '#0d1526' : '#0a1120',
                borderTop: '1px solid #1a2540'
              }}>
              <div className="col-span-3">
                <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                  {ligne.produits?.nom ?? 'Produit inconnu'}
                </p>
                <p className="text-xs" style={{ color: '#4a6fa5' }}>{ligne.produits?.unite}</p>
              </div>
              <div className="col-span-2 text-sm" style={{ color: '#94a3b8' }}>
                {ligne.quantite_commandee} {ligne.produits?.unite}
              </div>
              <div className="col-span-3">
                {dejaRecu ? (
                  <span className="text-sm" style={{ color: '#4a6fa5' }}>
                    {ligne.quantite_recue ?? '—'} {ligne.produits?.unite}
                  </span>
                ) : (
                  <input type="number" min="0" step="0.1"
                    value={quantitesRecues[ligne.id] ?? ligne.quantite_commandee}
                    onChange={e => setQuantitesRecues(q => ({ ...q, [ligne.id]: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1.5 rounded text-sm outline-none"
                    style={{ background: '#0a1120', border: `1px solid ${hasEcart ? (ecartPct < 0 ? '#7f1d1d' : '#14532d') : '#1e2d4a'}`, color: '#e2e8f0' }} />
                )}
              </div>
              <div className="col-span-2 text-sm font-medium" style={{ color: ecartColor }}>
                {ecartPct === 0 ? '✓' : `${ecartPct > 0 ? '+' : ''}${ecartPct.toFixed(1)}%`}
              </div>
              <div className="col-span-2">
                {hasEcart && !dejaRecu && (
                  <input value={notesEcart[ligne.id] ?? ''} placeholder="Motif..."
                    onChange={e => setNotesEcart(n => ({ ...n, [ligne.id]: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#e2e8f0' }} />
                )}
                {dejaRecu && ligne.note_ecart && (
                  <span className="text-xs" style={{ color: '#4a6fa5' }}>{ligne.note_ecart}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: '#1a0505', color: '#f87171', border: '1px solid #dc2626' }}>
          {error}
        </div>
      )}

      {commande.statut === 'brouillon' && (
        <div className="flex justify-end gap-3">
          <button onClick={() => {
            setError(null)
            startTransition(async () => {
              try {
                await envoyerCommande(commande.id)
              } catch (e) {
                setError(e instanceof Error ? e.message : "Erreur lors de l'envoi")
              }
            })
          }} disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            Envoyer au fournisseur
          </button>
        </div>
      )}

      {!dejaRecu && commande.statut !== 'brouillon' && (
        <div className="flex justify-end">
          <button onClick={handleReceptionner} disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)' }}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Valider la réception et mettre à jour les stocks
          </button>
        </div>
      )}
    </div>
  )
}
