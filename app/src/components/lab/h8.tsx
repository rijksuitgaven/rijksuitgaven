'use client'

import { Link2, ArrowRight } from 'lucide-react'

/**
 * V2.5 Shared View Prototype — Banner Design
 *
 * The shared page IS the module page. This prototype only validates
 * the two banners that wrap it: share context bar + conversion strip.
 *
 * Real /s/[token] route will render these banners above the actual ModulePage.
 */
export default function SharedViewPrototype() {
  return (
    <div style={{ fontFamily: 'var(--font-condensed), sans-serif' }}>
      {/* ── Share context banner ── */}
      <div className="px-6" style={{ background: 'var(--navy-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(230,45,117,0.15)', border: '1px solid rgba(230,45,117,0.25)' }}>
              <Link2 className="w-3.5 h-3.5" style={{ color: 'var(--pink)' }} />
            </div>
            <span className="text-[13px] text-white/90 font-medium">
              <strong className="text-white font-semibold">Gedeelde weergave</strong>
              <span className="text-white/25 mx-1.5">&middot;</span>
              Instrumenten
            </span>
          </div>
          <span className="text-xs text-white/40 whitespace-nowrap shrink-0 hidden sm:inline">Gedeeld op 5 maart 2026</span>
        </div>
      </div>

      {/* ── Conversion strip ── */}
      <div className="px-6 border-b" style={{ background: '#fdf0f3', borderColor: '#f5c6d0' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2 gap-4">
          <span className="text-[13px]" style={{ color: 'var(--navy-dark)' }}>
            <strong className="font-semibold">U bekijkt een gedeeld overzicht.</strong>{' '}
            Wilt u zelf zoeken, filteren en exporteren?
          </span>
          <a href="/#aanmelden" className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold px-4 py-1.5 rounded-md whitespace-nowrap transition-all no-underline" style={{ background: 'var(--pink)' }}>
            Probeer gratis
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── Placeholder for the real module page ── */}
      <div className="min-h-screen bg-gradient-to-b from-[var(--gray-light)] to-white">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 shadow-sm">
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: 'var(--navy-medium)' }}>
                Hier wordt de echte modulepagina getoond — exact zoals de ingelogde gebruiker het ziet.
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--navy-medium)', opacity: 0.6 }}>
                Zoekresultaten, filters, kolommen en uitklap-status worden hersteld vanuit de gedeelde link.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
