'use client'

import { CreateOrganization } from '@clerk/nextjs'

export default function OnboardingPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#04080f' }}>
      <div style={{ width: '100%', maxWidth: '32rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e2e8f0' }}>
            Bienvenue sur RestoFlow
          </h1>
          <p style={{ color: '#4a6fa5', marginTop: '0.5rem' }}>
            Créez l'espace de votre restaurant pour commencer.
          </p>
        </div>
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </div>
    </div>
  )
}
