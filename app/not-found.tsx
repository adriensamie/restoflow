import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#04080f', color: '#e2e8f0', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '700' }}>404</h1>
      <p style={{ color: '#4a6fa5' }}>Page introuvable</p>
      <Link href="/" style={{ color: '#60a5fa' }}>Retour à l&apos;accueil</Link>
    </div>
  )
}