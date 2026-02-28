import Link from 'next/link'

export default function ConfidentialitePage() {
  return (
    <div style={{ background: '#04080f', color: '#e2e8f0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
        <Link href="/" className="text-blue-400 text-sm hover:underline">&larr; Retour</Link>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>
          Politique de Confidentialite
        </h1>
        <p style={{ color: '#4a6fa5', marginBottom: 40 }}>Derniere mise a jour : 27 fevrier 2026</p>

        <div style={{ lineHeight: 1.8, color: '#94a3b8' }} className="space-y-8">
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>1. Responsable du traitement</h2>
            <p>RestoFlow SAS est responsable du traitement des donnees personnelles collectees via la plateforme RestoFlow. Contact : <a href="mailto:hello@restoflow.fr" className="text-blue-400 hover:underline">hello@restoflow.fr</a>.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>2. Donnees collectees</h2>
            <p>Nous collectons les donnees suivantes :</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }} className="list-disc space-y-2">
              <li><strong style={{ color: '#e2e8f0' }}>Donnees d&apos;identification</strong> : nom, prenom, adresse email, numero de telephone (via Clerk).</li>
              <li><strong style={{ color: '#e2e8f0' }}>Donnees d&apos;organisation</strong> : nom du restaurant, adresse, SIRET, informations de l&apos;equipe.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Donnees metier</strong> : stocks, commandes, recettes, plannings, releves HACCP, donnees financieres.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Donnees techniques</strong> : adresse IP, navigateur, cookies de session.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Donnees de paiement</strong> : gerees exclusivement par Stripe. Nous ne stockons aucun numero de carte bancaire.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>3. Finalites du traitement</h2>
            <p>Vos donnees sont traitees pour :</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }} className="list-disc space-y-2">
              <li>Fournir et ameliorer le service RestoFlow.</li>
              <li>Gerer votre compte et votre abonnement.</li>
              <li>Generer des analyses et des previsions (fonctionnalites IA).</li>
              <li>Assurer la securite et prevenir la fraude.</li>
              <li>Respecter nos obligations legales.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>4. Base legale</h2>
            <p>Le traitement de vos donnees repose sur : l&apos;execution du contrat (fourniture du service), votre consentement (cookies, communications marketing), notre interet legitime (securite, amelioration du service), et nos obligations legales.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>5. Sous-traitants</h2>
            <p>Nous faisons appel aux sous-traitants suivants :</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }} className="list-disc space-y-2">
              <li><strong style={{ color: '#e2e8f0' }}>Clerk</strong> : authentification et gestion des utilisateurs.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Supabase</strong> : hebergement de la base de donnees (serveurs en Europe).</li>
              <li><strong style={{ color: '#e2e8f0' }}>Stripe</strong> : traitement des paiements.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Anthropic (Claude)</strong> : traitement IA (donnees non conservees par le fournisseur).</li>
              <li><strong style={{ color: '#e2e8f0' }}>Vercel</strong> : hebergement de l&apos;application.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>6. Duree de conservation</h2>
            <p>Les donnees sont conservees pendant la duree de votre abonnement et 12 mois apres la cloture de votre compte. Les donnees de facturation sont conservees 10 ans conformement aux obligations comptables. Vous pouvez demander la suppression anticipee de vos donnees.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>7. Securite</h2>
            <p>Nous mettons en oeuvre des mesures de securite appropriees : chiffrement des donnees en transit (TLS) et au repos, isolation des donnees par organisation (Row Level Security), authentification securisee via Clerk, sauvegardes automatiques regulieres.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>8. Vos droits (RGPD)</h2>
            <p>Conformement au Reglement General sur la Protection des Donnees (RGPD), vous disposez des droits suivants :</p>
            <ul style={{ paddingLeft: 24, marginTop: 8 }} className="list-disc space-y-2">
              <li><strong style={{ color: '#e2e8f0' }}>Droit d&apos;acces</strong> : obtenir une copie de vos donnees personnelles.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Droit de rectification</strong> : corriger des donnees inexactes.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Droit a l&apos;effacement</strong> : demander la suppression de vos donnees.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Droit a la portabilite</strong> : recevoir vos donnees dans un format structure.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Droit d&apos;opposition</strong> : vous opposer a certains traitements.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Droit a la limitation</strong> : limiter le traitement de vos donnees.</li>
            </ul>
            <p style={{ marginTop: 12 }}>Pour exercer ces droits, contactez-nous a <a href="mailto:hello@restoflow.fr" className="text-blue-400 hover:underline">hello@restoflow.fr</a>. Nous repondrons dans un delai de 30 jours.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>9. Cookies</h2>
            <p>RestoFlow utilise uniquement des cookies essentiels au fonctionnement du service (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilise.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>10. Contact et reclamation</h2>
            <p>Pour toute question relative a la protection de vos donnees : <a href="mailto:hello@restoflow.fr" className="text-blue-400 hover:underline">hello@restoflow.fr</a>. Vous disposez egalement du droit d&apos;introduire une reclamation aupres de la CNIL (Commission Nationale de l&apos;Informatique et des Libertes).</p>
          </section>
        </div>
      </div>
    </div>
  )
}
