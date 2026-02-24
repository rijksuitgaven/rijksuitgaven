'use client'

import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TeamNav } from '@/components/team-nav'
import { FlaskConical } from 'lucide-react'

export const LAB_PAGES = [
  { slug: 'h1', title: 'Geldstroom Sankey', description: 'Sankey-visualisatie van geldstromen tussen ministeries en ontvangers' },
  { slug: 'h2', title: 'Data Table Prototype', description: 'Tabelweergave met 56 ontvangers uit productie-data' },
  { slug: 'h4', title: 'Provincie Kaart', description: 'Interactieve kaart met provinciedata (mock)' },
  { slug: 'h5', title: 'Het Verschil', description: 'Before/after scroll-narrative: handmatig onderzoek vs. Rijksuitgaven' },
]

export default function LabIndexPage() {
  const { role, loading: subLoading } = useSubscription()

  if (subLoading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[var(--navy-medium)]">Laden...</p>
      </main>
    )
  }

  if (role !== 'admin') {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--navy-dark)]">Geen toegang</h1>
          <p className="text-[var(--navy-medium)]">Deze pagina is alleen beschikbaar voor beheerders.</p>
          <Link href="/" className="text-[var(--pink)] hover:underline">Terug naar home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      <TeamNav />

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--navy-dark)] mb-1">Lab</h1>
        <p className="text-sm text-[var(--navy-medium)]">
          Testomgeving voor prototypes en design-experimenten. Alleen zichtbaar voor beheerders.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LAB_PAGES.map(page => (
          <Link
            key={page.slug}
            href={`/team/lab/${page.slug}`}
            className="bg-white border border-[var(--border)] rounded-lg p-5 hover:border-[var(--navy-medium)] transition-colors group"
          >
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-[var(--navy-medium)] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[var(--navy-medium)] uppercase">{page.slug}</span>
                  <h2 className="text-sm font-semibold text-[var(--navy-dark)] truncate">{page.title}</h2>
                </div>
                <p className="text-xs text-[var(--navy-medium)] line-clamp-2">{page.description}</p>
                <span className="inline-block mt-3 text-xs font-medium text-[var(--pink)] group-hover:underline">
                  Open →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
