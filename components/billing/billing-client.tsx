'use client'

import { useState } from 'react'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import type { Plan } from '@/lib/plans'

interface BillingClientProps {
  currentPlan: Plan
  subscriptionStatus: string | null
  daysLeft: number | null
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 49,
    features: [
      'Stocks & Pertes',
      'Commandes & Livraisons',
      'Recettes & Food Cost',
      'Planning equipe',
      'HACCP',
      'Marges & Inventaire',
      'Alertes',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 99,
    featured: true,
    features: [
      'Tout Starter inclus',
      'Previsions IA meteo',
      'Assistant IA illimite',
      'Anti-Fraude Caisse',
      'Cave a vins',
      'Import BL par photo',
      'Fiches de paie',
      'Integrations caisses',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 199,
    features: [
      'Tout Pro inclus',
      "Jusqu'a 5 etablissements",
      'Dashboard consolide',
      'Comparaison inter-sites',
      'API acces complet',
      'Support prioritaire',
    ],
  },
]

export function BillingClient({ currentPlan, subscriptionStatus, daysLeft }: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: 'starter' | 'pro' | 'enterprise') {
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {/* Current plan info */}
      <div className="rounded-xl p-5 mb-8" style={{ background: '#0f1729', border: '1px solid #1e2d4a' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Plan actuel</p>
            <p className="text-xl font-bold text-white mt-1">
              {currentPlan === 'trial' ? 'Essai gratuit' : plans.find(p => p.id === currentPlan)?.name ?? currentPlan}
            </p>
            {currentPlan === 'trial' && daysLeft !== null && (
              <p className="text-sm text-blue-400 mt-1">{daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</p>
            )}
            {subscriptionStatus && (
              <p className="text-xs text-gray-500 mt-1">Statut : {subscriptionStatus}</p>
            )}
          </div>
          {subscriptionStatus === 'active' && (
            <button onClick={handlePortal} disabled={loading === 'portal'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white"
              style={{ border: '1px solid #1e2d4a' }}>
              {loading === 'portal' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Gerer l&apos;abonnement
            </button>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlan
          const isDowngrade = currentPlan === 'enterprise' && plan.id !== 'enterprise'
            || currentPlan === 'pro' && plan.id === 'starter'

          return (
            <div key={plan.id} className="rounded-xl p-6 relative"
              style={{
                background: plan.featured ? 'linear-gradient(180deg, rgba(14, 165, 233, 0.08), #0f1729)' : '#0f1729',
                border: `1px solid ${plan.featured ? '#1d4ed8' : '#1e2d4a'}`,
              }}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  Le plus populaire
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{plan.name}</p>
              <p className="text-4xl font-bold text-white mb-1">
                <span className="text-lg align-top">EUR</span>{plan.price}
              </p>
              <p className="text-sm text-gray-500 mb-6">par mois</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={isCurrent || isDowngrade || loading !== null}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={plan.featured
                  ? { background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)', color: 'white' }
                  : { border: '1px solid #1e2d4a', color: '#e2e8f0' }
                }>
                {loading === plan.id ? (
                  <Loader2 size={14} className="animate-spin mx-auto" />
                ) : isCurrent ? (
                  'Plan actuel'
                ) : isDowngrade ? (
                  'Contacter le support'
                ) : (
                  'Choisir ce plan'
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
