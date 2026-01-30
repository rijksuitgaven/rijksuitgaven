'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

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
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 group">
              <Image
                src="/logo-icon.png"
                alt="Rijksuitgaven"
                width={56}
                height={56}
                className="h-14 w-auto transition-transform group-hover:scale-105"
                priority
              />
              <div className="hidden sm:block">
                <h1
                  className="text-2xl font-bold text-[var(--navy-dark)] tracking-tight"
                  style={{ fontFamily: 'var(--font-heading), serif' }}
                >
                  Rijksuitgaven
                </h1>
                <p className="text-sm text-[var(--pink)] font-medium -mt-0.5">
                  Snel inzicht voor krachtige analyses
                </p>
              </div>
            </Link>

            {/* Auth */}
            <div className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="/profiel"
                className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
              >
                Profiel
              </Link>
              <Link
                href="/logout"
                className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors"
              >
                Uitloggen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav
        ref={navRef}
        className="bg-white border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-stretch overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>

            {/* Ontvangers Section */}
            <div className="flex items-stretch">
              <span className="flex items-center pr-1 text-[10px] font-medium uppercase tracking-wider text-[var(--navy-medium)]/60">
                Ontvangers
              </span>
              <div className="flex items-stretch">
                {ONTVANGERS_MODULES.map((module) => {
                  const isActive = pathname === `/${module.id}`
                  return (
                    <Link
                      key={module.id}
                      href={`/${module.id}`}
                      data-active={isActive}
                      className={cn(
                        'group relative flex items-center gap-1 px-3 py-5 text-sm font-medium transition-colors whitespace-nowrap',
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
                        'absolute bottom-0 left-3 right-3 h-[3px] transition-all',
                        isActive
                          ? 'bg-[var(--pink)]'
                          : 'bg-[var(--pink)]/0 group-hover:bg-[var(--pink)]/30'
                      )} />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Vertical divider */}
            <div className="flex items-center px-3">
              <div className="h-6 w-px bg-[var(--border)]" />
            </div>

            {/* Kosten Section */}
            <div className="flex items-stretch">
              <span className="flex items-center pr-1 text-[10px] font-medium uppercase tracking-wider text-[var(--navy-medium)]/60">
                Kosten
              </span>
              <div className="flex items-stretch">
                {KOSTEN_MODULES.map((module) => {
                  const isActive = pathname === `/${module.id}`
                  return (
                    <Link
                      key={module.id}
                      href={`/${module.id}`}
                      data-active={isActive}
                      className={cn(
                        'group relative flex items-center px-3 py-5 text-sm font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'text-[var(--navy-dark)]'
                          : 'text-[var(--navy-medium)] hover:text-[var(--navy-dark)]'
                      )}
                    >
                      {module.name}
                      {/* Hover preview indicator */}
                      <span className={cn(
                        'absolute bottom-0 left-3 right-3 h-[3px] transition-all',
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
