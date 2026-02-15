'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AuthButton } from '@/components/auth'

// Force hard navigation to reset all filters and page state
function useHardNavigation() {
  return useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    window.location.href = href
  }, [])
}

// Ontvangers modules (recipient-based data)
const ONTVANGERS_MODULES = [
  { id: 'integraal', name: 'Zoek in alle', isSearch: true },
  { id: 'instrumenten', name: 'Financiële instrumenten' },
  { id: 'provincie', name: 'Provinciale subsidieregisters' },
  { id: 'gemeente', name: 'Gemeentelijke subsidieregisters' },
  { id: 'inkoop', name: 'Inkoopuitgaven' },
  { id: 'publiek', name: 'Publiek' },
]

// Kosten module (cost-based data)
const KOSTEN_MODULES = [
  { id: 'apparaat', name: 'Apparaatskosten' },
]

export function Header() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)
  const handleHardNav = useHardNavigation()

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (navRef.current) {
      const activeTab = navRef.current.querySelector('[data-active="true"]')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* Masthead: Logo + Auth */}
      <div className="border-b border-[var(--gray-light)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo - Hybrid: icon on mobile, full designed logo on desktop */}
            <Link href="/" className="flex items-center group">
              {/* Mobile: icon only */}
              <Image
                src="/logo-icon.png"
                alt="Rijksuitgaven"
                width={48}
                height={48}
                className="h-12 w-12 sm:hidden transition-transform group-hover:scale-105"
                priority
              />
              {/* Desktop: full designed logo asset (pixel-perfect alignment) */}
              <Image
                src="/logo.png"
                alt="Rijksuitgaven - Snel inzicht voor krachtige analyses"
                width={280}
                height={80}
                className="hidden sm:block h-14 w-auto transition-transform group-hover:scale-[1.02]"
                priority
              />
              {/* Screen reader accessible title */}
              <h1 className="sr-only">Rijksuitgaven</h1>
            </Link>

            <AuthButton />
          </div>
        </div>
      </div>

      {/* Navigation Bar — Condensed font for space-constrained horizontal nav */}
      <nav
        ref={navRef}
        className="bg-white border-b border-[var(--border)]"
        style={{ fontFamily: 'var(--font-condensed)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-stretch overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>

            {/* Ontvangers Section */}
            <div className="flex items-stretch">
              <span className="flex items-center px-2.5 py-1 mr-2 my-auto text-[10px] font-semibold uppercase tracking-wider text-white bg-[var(--navy-medium)] rounded">
                Ontvangers
              </span>
              <div className="flex items-stretch">
                {ONTVANGERS_MODULES.map((module) => {
                  const isActive = pathname === `/${module.id}`
                  return (
                    <Link
                      key={module.id}
                      href={`/${module.id}`}
                      onClick={(e) => handleHardNav(e, `/${module.id}`)}
                      data-active={isActive}
                      className={cn(
                        'group relative flex items-center gap-1 px-2.5 py-5 text-sm font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-[var(--navy-dark)]'
                          : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)]'
                      )}
                    >
                      {module.isSearch && (
                        <svg className={cn('w-4 h-4', isActive ? 'text-[var(--pink)]' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      {module.name}
                      {/* Hover preview indicator */}
                      <span className={cn(
                        'absolute bottom-0 left-2.5 right-2.5 h-[3px] transition-all',
                        isActive
                          ? 'bg-[var(--pink)]'
                          : 'bg-[var(--pink)]/0 group-hover:bg-[var(--pink)]/30'
                      )} />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Kosten Section */}
            <div className="flex items-stretch ml-4">
              <span className="flex items-center px-2.5 py-1 mr-2 my-auto text-[10px] font-semibold uppercase tracking-wider text-white bg-[var(--navy-medium)] rounded">
                Kosten
              </span>
              <div className="flex items-stretch">
                {KOSTEN_MODULES.map((module) => {
                  const isActive = pathname === `/${module.id}`
                  return (
                    <Link
                      key={module.id}
                      href={`/${module.id}`}
                      onClick={(e) => handleHardNav(e, `/${module.id}`)}
                      data-active={isActive}
                      className={cn(
                        'group relative flex items-center px-2.5 py-5 text-sm font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-[var(--navy-dark)]'
                          : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)]'
                      )}
                    >
                      {module.name}
                      {/* Hover preview indicator */}
                      <span className={cn(
                        'absolute bottom-0 left-2.5 right-2.5 h-[3px] transition-all',
                        isActive
                          ? 'bg-[var(--pink)]'
                          : 'bg-[var(--pink)]/0 group-hover:bg-[var(--pink)]/30'
                      )} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
