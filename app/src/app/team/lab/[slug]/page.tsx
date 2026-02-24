'use client'

import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { LAB_PAGES } from '../page'

const LAB_COMPONENTS: Record<string, React.ComponentType> = {
  h1: dynamic(() => import('@/components/lab/h1')),
  h2: dynamic(() => import('@/components/lab/h2')),
  h4: dynamic(() => import('@/components/lab/h4')),
  h5: dynamic(() => import('@/components/lab/h5')),
}

export default function LabSlugPage() {
  const { slug } = useParams<{ slug: string }>()
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

  const Component = LAB_COMPONENTS[slug]
  const pageInfo = LAB_PAGES.find(p => p.slug === slug)

  if (!Component || !pageInfo) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--navy-dark)]">Pagina niet gevonden</h1>
          <Link href="/team/lab" className="text-[var(--pink)] hover:underline">Terug naar Lab</Link>
        </div>
      </main>
    )
  }

  return (
    <div>
      {/* Sticky back bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <Link
            href="/team/lab"
            className="text-sm text-[var(--navy-medium)] hover:text-[var(--pink)] transition-colors"
          >
            ← Lab
          </Link>
          <span className="text-[var(--border)]">|</span>
          <span className="text-xs font-mono text-[var(--navy-medium)] uppercase">{pageInfo.slug}</span>
          <span className="text-sm font-medium text-[var(--navy-dark)]">{pageInfo.title}</span>
        </div>
      </div>

      <Component />
    </div>
  )
}
