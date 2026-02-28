import Link from 'next/link'

export default function CGUPage() {
  return (
    <div style={{ background: '#04080f', color: '#e2e8f0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
        <Link href="/" className="text-blue-400 text-sm hover:underline">&larr; Retour</Link>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>
          Conditions Generales d&apos;Utilisation
        </h1>
        <p style={{ color: '#4a6fa5', marginBottom: 40 }}>Derniere mise a jour : 27 fevrier 2026</p>

        <div style={{ lineHeight: 1.8, color: '#94a3b8' }} className="space-y-8">
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>1. Objet</h2>
            <p>Les presentes Conditions Generales d&apos;Utilisation (CGU) regissent l&apos;acces et l&apos;utilisation de la plateforme RestoFlow, editee par RestoFlow SAS. RestoFlow est un logiciel en mode SaaS (Software as a Service) destine a la gestion de restaurants : stocks, commandes, recettes, planning, HACCP, previsions et analyses.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>2. Acceptation</h2>
            <p>L&apos;inscription sur la plateforme implique l&apos;acceptation pleine et entiere des presentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>3. Inscription et compte</h2>
            <p>L&apos;utilisateur s&apos;engage a fournir des informations exactes lors de l&apos;inscription. Chaque organisation (restaurant) dispose de son propre espace isole. L&apos;administrateur de l&apos;organisation est responsable de la gestion des acces de son equipe.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>4. Abonnement et paiement</h2>
            <p>RestoFlow propose plusieurs plans d&apos;abonnement (Starter, Pro, Enterprise). Un essai gratuit de 14 jours est offert a la creation de chaque organisation. Les paiements sont geres par Stripe. L&apos;abonnement est mensuel et se renouvelle automatiquement. La resiliation est possible a tout moment depuis le portail de facturation.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>5. Utilisation du service</h2>
            <p>L&apos;utilisateur s&apos;engage a utiliser RestoFlow conformement a sa destination : la gestion d&apos;etablissements de restauration. Il est interdit de tenter de contourner les mesures de securite, d&apos;acceder aux donnees d&apos;autres organisations, ou d&apos;utiliser le service a des fins illegales.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>6. Donnees</h2>
            <p>Les donnees saisies par l&apos;utilisateur lui appartiennent. RestoFlow s&apos;engage a ne pas revendre les donnees a des tiers. Les donnees sont hebergees sur des serveurs securises (Supabase, infrastructure AWS/GCP en Europe). L&apos;utilisateur peut demander l&apos;export ou la suppression de ses donnees a tout moment.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>7. Intelligence artificielle</h2>
            <p>RestoFlow utilise des modeles d&apos;intelligence artificielle (Claude par Anthropic) pour certaines fonctionnalites : previsions, analyse de documents, assistant conversationnel. Les donnees transmises a l&apos;IA sont traitees en temps reel et ne sont pas stockees par le fournisseur d&apos;IA. Les resultats de l&apos;IA sont fournis a titre indicatif et ne constituent pas des conseils professionnels.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>8. Disponibilite</h2>
            <p>RestoFlow s&apos;efforce de maintenir un taux de disponibilite de 99.9%. Des interruptions de service peuvent survenir pour maintenance. L&apos;utilisateur sera prevenu en cas de maintenance planifiee. RestoFlow ne saurait etre tenu responsable des interruptions dues a des causes de force majeure.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>9. Responsabilite</h2>
            <p>RestoFlow fournit un outil de gestion et ne saurait etre tenu responsable des decisions prises par l&apos;utilisateur sur la base des donnees affichees. L&apos;utilisateur reste seul responsable du respect des normes HACCP et des obligations legales propres a son activite.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>10. Modification des CGU</h2>
            <p>RestoFlow se reserve le droit de modifier les presentes CGU. Les utilisateurs seront informes par email de toute modification substantielle. L&apos;utilisation continue du service apres modification vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>11. Contact</h2>
            <p>Pour toute question relative aux presentes CGU, contactez-nous a <a href="mailto:hello@restoflow.fr" className="text-blue-400 hover:underline">hello@restoflow.fr</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
