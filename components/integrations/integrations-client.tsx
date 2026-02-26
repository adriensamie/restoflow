'use client'

import { useState } from 'react'
import { PlugZap, Check, Copy, ExternalLink, ChevronRight, AlertCircle, Webhook, Database, CreditCard, Package, Truck, FileText } from 'lucide-react'
import { sauvegarderConfigCaisse } from '@/lib/actions/antifraud'

const CAISSES = [
  { id: '6xpos',      nom: '6Xpos',       logo: '6️⃣',  description: 'Logiciel caisse restauration français', docs: 'https://6xpos.fr' },
  { id: 'zelty',      nom: 'Zelty',       logo: '🟢',  description: 'Caisse iPad pour restaurants', docs: 'https://zelty.fr' },
  { id: 'laddition',  nom: "L'Addition",  logo: '➕',  description: 'Encaissement & gestion restaurant', docs: 'https://laddition.com' },
  { id: 'lightspeed', nom: 'Lightspeed',  logo: '⚡',  description: 'POS cloud multi-établissements', docs: 'https://lightspeedhq.com' },
  { id: 'sunday',     nom: 'Sunday',      logo: '☀️',  description: 'Paiement QR code à table', docs: 'https://sundayapp.com' },
  { id: 'sumeria',    nom: 'Sumeria',     logo: '💜',  description: 'Banque pro + caisse Lydia', docs: 'https://sumeria.eu' },
]

const AUTRES_INTEGRATIONS = [
  {
    categorie: 'Comptabilité',
    icon: FileText,
    color: '#60a5fa',
    items: [
      { nom: 'Export CSV', description: 'Export de toutes les données en CSV', statut: 'disponible', badge: 'Disponible' },
      { nom: 'Pennylane', description: 'Synchronisation comptable automatique', statut: 'bientot', badge: 'Bientôt' },
      { nom: 'QuickBooks', description: 'Export vers QuickBooks', statut: 'bientot', badge: 'Bientôt' },
    ]
  },
  {
    categorie: 'Fournisseurs',
    icon: Truck,
    color: '#4ade80',
    items: [
      { nom: 'Import BL par photo IA', description: 'Scan bon de livraison → stocks automatiques', statut: 'disponible', badge: 'Actif' },
      { nom: 'Metro', description: 'Catalogue et commandes Metro', statut: 'bientot', badge: 'Bientôt' },
      { nom: 'Transgourmet', description: 'Commandes Transgourmet', statut: 'bientot', badge: 'Bientôt' },
    ]
  },
  {
    categorie: 'Livraison',
    icon: Package,
    color: '#f97316',
    items: [
      { nom: 'Uber Eats', description: 'Sync commandes et CA', statut: 'bientot', badge: 'Bientôt' },
      { nom: 'Deliveroo', description: 'Sync commandes et CA', statut: 'bientot', badge: 'Bientôt' },
      { nom: 'Just Eat', description: 'Sync commandes et CA', statut: 'bientot', badge: 'Bientôt' },
    ]
  },
  {
    categorie: 'Paiement',
    icon: CreditCard,
    color: '#a78bfa',
    items: [
      { nom: 'Stripe', description: 'Paiements SaaS RestoFlow', statut: 'disponible', badge: 'Actif' },
      { nom: 'SumUp', description: 'Terminal SumUp → CA automatique', statut: 'bientot', badge: 'Bientôt' },
    ]
  },
]

export function IntegrationsClient({ orgId, configCaisse, webhookUrl }: {
  orgId: string, configCaisse: any, webhookUrl: string
}) {
  const [caisseSel, setCaisseSel] = useState<string>(configCaisse?.source || '')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [seuil, setSeuil] = useState(configCaisse?.seuil_alerte_annulation?.toString() || '50')

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveCaisse = async () => {
    if (!caisseSel) return
    setSaving(true)
    try {
      await sauvegarderConfigCaisse({
        source: caisseSel,
        seuil_alerte_annulation: parseFloat(seuil) || 50,
        alertes_actives: true,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const inputStyle = {
    background: '#0a1120', border: '1px solid #1e2d4a',
    color: '#e2e8f0', borderRadius: '8px',
    padding: '8px 12px', outline: 'none', fontSize: '14px'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
          <PlugZap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Intégrations</h1>
          <p className="text-sm" style={{ color: '#4a6fa5' }}>Connectez vos outils à RestoFlow</p>
        </div>
      </div>

      {/* SECTION CAISSE */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Webhook size={16} style={{ color: '#60a5fa' }} />
          <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>Logiciel de caisse</h2>
          {configCaisse?.statut_connexion === 'connecte' && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0a2d1a', color: '#4ade80' }}>
              ● Connecté
            </span>
          )}
        </div>

        {/* Grille caisses */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {CAISSES.map(c => (
            <button key={c.id} onClick={() => setCaisseSel(c.id)}
              className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
              style={{
                background: caisseSel === c.id ? '#0a1f3d' : '#0d1526',
                border: `1px solid ${caisseSel === c.id ? '#3b82f6' : '#1e2d4a'}`,
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{c.logo}</span>
                {caisseSel === c.id && <Check size={16} style={{ color: '#60a5fa' }} />}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{c.nom}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>{c.description}</p>
            </button>
          ))}
        </div>

        {/* Config webhook si caisse sélectionnée */}
        {caisseSel && (
          <div className="p-5 rounded-xl space-y-4" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
            <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              Configuration {CAISSES.find(c => c.id === caisseSel)?.nom}
            </p>

            {/* URL Webhook */}
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#4a6fa5' }}>
                URL Webhook à coller dans votre caisse
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg text-xs font-mono overflow-x-auto"
                  style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#60a5fa' }}>
                  {webhookUrl}&source={caisseSel}
                </div>
                <button onClick={() => copy(`${webhookUrl}&source=${caisseSel}`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs flex-shrink-0 transition-all"
                  style={{ background: copied ? '#0a2d1a' : '#1e2d4a', color: copied ? '#4ade80' : '#94a3b8' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-lg" style={{ background: '#0a1120', border: '1px solid #1e3a6a' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#60a5fa' }}>
                📋 Instructions {CAISSES.find(c => c.id === caisseSel)?.nom} :
              </p>
              <ol className="text-xs space-y-1" style={{ color: '#4a6fa5' }}>
                <li>1. Connectez-vous à votre back-office {CAISSES.find(c => c.id === caisseSel)?.nom}</li>
                <li>2. Allez dans Paramètres → Webhooks / Intégrations</li>
                <li>3. Ajoutez l'URL ci-dessus comme endpoint webhook</li>
                <li>4. Activez les événements : commandes, annulations, remises, paiements</li>
                <li>5. Sauvegardez — RestoFlow reçoit les données en temps réel</li>
              </ol>
              <a href={CAISSES.find(c => c.id === caisseSel)?.docs} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 mt-2 text-xs"
                style={{ color: '#3b82f6' }}>
                <ExternalLink size={10} />Documentation {CAISSES.find(c => c.id === caisseSel)?.nom}
              </a>
            </div>

            {/* Seuil alerte */}
            <div className="flex items-center gap-3">
              <label className="text-xs flex-shrink-0" style={{ color: '#4a6fa5' }}>
                Seuil alerte annulation (€)
              </label>
              <input type="number" value={seuil} onChange={e => setSeuil(e.target.value)}
                style={{ ...inputStyle, width: '100px' }} />
            </div>

            <button onClick={handleSaveCaisse} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
              style={{ background: saved ? 'linear-gradient(135deg, #15803d, #4ade80)' : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', opacity: saving ? 0.6 : 1 }}>
              {saved ? <><Check size={14} />Sauvegardé</> : saving ? 'Sauvegarde...' : 'Enregistrer la configuration'}
            </button>
          </div>
        )}
      </div>

      {/* AUTRES INTÉGRATIONS */}
      {AUTRES_INTEGRATIONS.map(section => {
        const Icon = section.icon
        return (
          <div key={section.categorie}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} style={{ color: section.color }} />
              <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>{section.categorie}</h2>
            </div>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.nom} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{item.nom}</p>
                    <p className="text-xs" style={{ color: '#4a6fa5' }}>{item.description}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{
                      background: item.statut === 'disponible' ? '#0a2d1a' : '#1a1505',
                      color: item.statut === 'disponible' ? '#4ade80' : '#fbbf24',
                    }}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* API RestoFlow */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} style={{ color: '#a78bfa' }} />
          <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>API RestoFlow</h2>
        </div>
        <div className="p-5 rounded-xl" style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>
            Votre Organization ID pour les intégrations tierces :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
              style={{ background: '#0a1120', border: '1px solid #1e2d4a', color: '#a78bfa' }}>
              {orgId}
            </code>
            <button onClick={() => copy(orgId)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs flex-shrink-0"
              style={{ background: '#1e2d4a', color: '#94a3b8' }}>
              <Copy size={12} />Copier
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: '#2d4a7a' }}>
            Utilisez cet ID comme paramètre <code style={{ color: '#60a5fa' }}>?org=</code> dans toutes vos intégrations webhook.
          </p>
        </div>
      </div>
    </div>
  )
}
