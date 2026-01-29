'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// Module tabs with grouping: Integraal | main modules | Apparaat
const MODULES = [
  // Group 1: Cross-module discovery
  { id: 'integraal', name: 'Integraal', group: 'discovery' },
  // Group 2: Recipient-based modules
  { id: 'instrumenten', name: 'Instrumenten', group: 'main' },
  { id: 'provincie', name: 'Provincie', group: 'main' },
  { id: 'gemeente', name: 'Gemeente', group: 'main' },
  { id: 'inkoop', name: 'Inkoop', group: 'main' },
  { id: 'publiek', name: 'Publiek', group: 'main' },
  // Group 3: Different data type (costs, not recipients)
  { id: 'apparaat', name: 'Apparaat', group: 'other' },
]

// Navigation items (V1.0: only Profiel/Logout shown, others reserved for V1.1+)
const NAV_ITEMS: { href: string; label: string }[] = [
  // { href: '/support', label: 'Support' },
  // { href: '/over-ons', label: 'Over ons' },
  // { href: '/contact', label: 'Contact' },
]

export function Header() {
  const pathname = usePathname()
  const tabsRef = useRef<HTMLDivElement>(null)

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [pathname])

  return (
    <header className="sticky top-0 z-40">
      {/* Row 1: Logo + Navigation */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Tagline */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo-white.png"
                alt="Rijksuitgaven"
                width={32}
                height={32}
                className="h-8 w-auto"
                priority
              />
              <div className="hidden sm:flex flex-col">
                <span
                  className="text-xl font-bold text-[var(--navy-dark)] leading-tight"
                  style={{ fontFamily: 'var(--font-heading), serif' }}
                >
                  Rijksuitgaven
                </span>
                <span className="text-xs text-[var(--pink)] leading-tight">
                  Snel inzicht voor krachtige analyses
                </span>
              </div>
            </Link>

            {/* Right side: Nav items + Auth */}
            <div className="flex items-center gap-6">
              {/* Future nav items (V1.1+) */}
              <nav className="hidden lg:flex items-center gap-6">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-[var(--navy-dark)] hover:text-[var(--navy-medium)] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Auth links */}
              <div className="flex items-center gap-4 text-sm">
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
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Module Tabs */}
      <div className="bg-[var(--gray-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            ref={tabsRef}
            className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MODULES.map((module, index) => {
              const isActive = pathname === `/${module.id}`
              const prevModule = MODULES[index - 1]

              // Add gap after Integraal (discovery -> main transition)
              const gapBefore = prevModule?.group === 'discovery' && module.group === 'main'
              // Add gap before Apparaat (main -> other transition)
              const gapBeforeApparaat = prevModule?.group === 'main' && module.group === 'other'

              return (
                <Link
                  key={module.id}
                  href={`/${module.id}`}
                  data-active={isActive}
                  className={cn(
                    'px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all shrink-0',
                    isActive
                      ? 'bg-white text-[var(--navy-dark)] shadow-sm'
                      : 'text-[var(--navy-dark)] hover:bg-white/50',
                    gapBefore && 'ml-6',
                    gapBeforeApparaat && 'ml-6'
                  )}
                >
                  {module.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
