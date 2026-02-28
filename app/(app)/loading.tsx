export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="flex gap-1.5 justify-center mb-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <p className="text-sm" style={{ color: '#4a6fa5' }}>Chargement...</p>
      </div>
    </div>
  )
}
