export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: '#080d1a' }}>
      {children}
    </div>
  )
}
