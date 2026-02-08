'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Er ging iets mis</h1>
        <p className="text-lg text-[var(--navy-medium)] mb-6">Er is een fout opgetreden. Probeer het opnieuw.</p>
        <button onClick={reset} className="px-6 py-3 bg-[var(--pink)] text-white rounded-lg hover:opacity-90 transition-opacity">
          Probeer opnieuw
        </button>
      </div>
    </div>
  )
}
