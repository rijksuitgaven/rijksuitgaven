import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>404</h1>
        <p className="text-lg text-[var(--navy-medium)] mb-6">Deze pagina bestaat niet.</p>
        <Link href="/" className="px-6 py-3 bg-[var(--pink)] text-white rounded-lg hover:opacity-90 transition-opacity">
          Naar de homepage
        </Link>
      </div>
    </div>
  )
}
