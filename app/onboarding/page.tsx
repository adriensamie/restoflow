'use client'

import { CreateOrganization } from '@clerk/nextjs'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue sur RestoFlow
          </h1>
          <p className="text-gray-500 mt-2">
            Créez l'espace de votre restaurant pour commencer.
          </p>
        </div>
        <CreateOrganization afterCreateOrganizationUrl="/dashboard" />
      </div>
    </div>
  )
}