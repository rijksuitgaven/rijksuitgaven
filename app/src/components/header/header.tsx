'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'

const MODULES = [
  { id: 'integraal', name: 'Integraal', description: 'Zoek over alle modules' },
  { id: 'instrumenten', name: 'Instrumenten', description: 'Subsidies en regelingen' },
  { id: 'apparaat', name: 'Apparaat', description: 'Operationele kosten' },
  { id: 'inkoop', name: 'Inkoop', description: 'Inkoop bij leveranciers' },
  { id: 'provincie', name: 'Provincie', description: 'Provinciale subsidies' },
  { id: 'gemeente', name: 'Gemeente', description: 'Gemeentelijke subsidies' },
  { id: 'publiek', name: 'Publiek', description: 'RVO, COA, NWO' },
]

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(false)

  const currentModule = MODULES.find((m) => pathname === `/${m.id}`)

  return (
    <header className="bg-[var(--navy-dark)] text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading), serif' }}
            >
              Rijksuitgaven
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {/* Modules dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsModulesOpen(!isModulesOpen)}
                onBlur={() => setTimeout(() => setIsModulesOpen(false), 150)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentModule
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {currentModule?.name || 'Modules'}
                <ChevronDown className={cn('h-4 w-4 transition-transform', isModulesOpen && 'rotate-180')} />
              </button>

              {isModulesOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-[var(--border)] overflow-hidden z-50">
                  {MODULES.map((module) => (
                    <Link
                      key={module.id}
                      href={`/${module.id}`}
                      onClick={() => setIsModulesOpen(false)}
                      className={cn(
                        'block px-4 py-3 hover:bg-[var(--gray-light)] transition-colors border-b border-[var(--border)] last:border-b-0',
                        pathname === `/${module.id}` && 'bg-[var(--gray-light)]'
                      )}
                    >
                      <div className="font-medium text-[var(--navy-dark)]">{module.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{module.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <Link
              href="/privacybeleid"
              className="px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </nav>

          {/* Search bar - desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Auth buttons - placeholder for Week 6 */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Inloggen
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Search bar - mobile */}
        <div className="md:hidden pb-4">
          <SearchBar />
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[var(--navy-dark)] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {MODULES.map((module) => (
              <Link
                key={module.id}
                href={`/${module.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-lg transition-colors',
                  pathname === `/${module.id}`
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <div className="font-medium">{module.name}</div>
                <div className="text-xs text-white/60">{module.description}</div>
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 mt-4">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-center bg-[var(--pink)] rounded-lg font-medium"
              >
                Inloggen
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
