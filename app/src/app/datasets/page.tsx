'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AVAILABLE_YEARS } from '@/lib/constants'

interface DataAvailability {
  module: string
  entity_type: string | null
  entity_name: string | null
  year_from: number
  year_to: number
}

// Source links for provinces (official subsidieregisters)
const PROVINCE_SOURCES: Record<string, string> = {
  'Drenthe': 'https://www.provincie.drenthe.nl/loket/subsidieloket/subsidieregister/',
  'Friesland': 'https://www.fryslan.frl/subsidies',
  'Gelderland': 'https://www.gelderland.nl/subsidies/subsidieregister-verleende-subsidies',
  'Limburg': 'https://www.limburg.nl/loket/subsidies/subsidieregister/',
  'Noord-Brabant': 'https://www.brabant.nl/loket/informatie-subsidie-aanvragen/openbaar-subsidie-bijdrageregister/subsidies-verleend-provincie/',
  'Noord-Holland': 'https://www.noord-holland.nl/Loket/Subsidies/Subsidieregister_en_kennisgeving_staatssteun',
  'Overijssel': 'https://regelen.overijssel.nl/Algemene_informatie/Informatie_over_subsidies/Openbaar_Subsidieregister',
  'Utrecht': 'https://www.provincie-utrecht.nl/loket/subsidies/verleende-subsidies',
  'Zeeland': 'https://www.zeeland.nl/subsidie-aanvragen/subsidieregister-provincie-zeeland',
}

// Section configuration — order matches UX-035 spec
const MODULE_SECTIONS: SectionConfig[] = [
  {
    module: 'instrumenten',
    title: 'Financiële Instrumenten',
    description: 'Subsidies, bijdragen en bekostigingen uit de rijksbegroting.',
    sourceLabel: 'data.overheid.nl',
    sourceUrl: 'https://data.overheid.nl/',
    type: 'simple',
  },
  {
    module: 'apparaat',
    title: 'Apparaatsuitgaven',
    description: 'Personeel- en materieelkosten van de rijksoverheid.',
    sourceLabel: 'data.overheid.nl',
    sourceUrl: 'https://data.overheid.nl/',
    type: 'simple',
  },
  {
    module: 'inkoop',
    title: 'Inkoopuitgaven',
    description: 'Goederen en diensten ingekocht door de rijksoverheid.',
    sourceLabel: 'data.overheid.nl',
    sourceUrl: 'https://data.overheid.nl/',
    type: 'simple',
  },
  {
    module: 'provincie',
    title: 'Provinciale subsidieregisters',
    description: 'Subsidieregisters gepubliceerd door provincies.',
    type: 'matrix',
    entityLabel: 'Provincie',
    sources: PROVINCE_SOURCES,
  },
  {
    module: 'gemeente',
    title: 'Gemeentelijke subsidieregisters',
    description: 'Subsidieregisters gepubliceerd door gemeenten.',
    type: 'matrix',
    entityLabel: 'Gemeente',
  },
  {
    module: 'publiek',
    title: 'Publieke uitvoeringsorganisaties en kennisinstellingen',
    description: 'Uitgaven van publieke uitvoeringsorganisaties.',
    type: 'matrix',
    entityLabel: 'Organisatie',
  },
]

interface SectionConfig {
  module: string
  title: string
  description: string
  type: 'simple' | 'matrix'
  sourceLabel?: string
  sourceUrl?: string
  entityLabel?: string
  sources?: Record<string, string>
}

const thStyle = 'px-3 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] text-sm'
const tdStyle = 'px-3 py-2 border-b border-[var(--border)] text-sm'
const yearThStyle = 'px-2 py-2 text-center font-semibold text-[var(--navy-dark)] border-b border-[var(--border)] text-sm w-[52px]'
const yearTdStyle = 'px-2 py-2 text-center border-b border-[var(--border)] text-sm'

export default function DatasetsPage() {
  const [data, setData] = useState<DataAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/datasets')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(setData)
      .catch(() => setError('Kon databeschikbaarheid niet laden.'))
      .finally(() => setLoading(false))
  }, [])

  const getModuleLevelData = (module: string) =>
    data.find(d => d.module === module && !d.entity_type)

  const getEntityData = (module: string) =>
    data
      .filter(d => d.module === module && d.entity_type)
      .sort((a, b) => (a.entity_name ?? '').localeCompare(b.entity_name ?? ''))

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block"
          >
            &larr; Terug naar home
          </Link>
          <h1
            className="text-2xl font-bold text-[var(--navy-dark)]"
            style={{ fontFamily: 'var(--font-heading), sans-serif' }}
          >
            Datasets
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2 text-base">
            Rijksuitgaven maakt gebruik van officiële overheidsdata. Onderstaand
            overzicht toont per module welke data beschikbaar is.
          </p>
        </div>

        {loading && (
          <p className="text-[var(--muted-foreground)]">Laden...</p>
        )}

        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="space-y-10">
            {MODULE_SECTIONS.map(section => {
              if (section.type === 'simple') {
                const moduleData = getModuleLevelData(section.module)
                if (!moduleData) return null
                return (
                  <section key={section.module}>
                    <h2
                      className="text-xl font-semibold text-[var(--navy-dark)] mb-2"
                      style={{ fontFamily: 'var(--font-heading), sans-serif' }}
                    >
                      {section.title}
                    </h2>
                    <p className="text-[var(--foreground)] text-base mb-2">
                      {section.description}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-sm">
                      Data van {moduleData.year_from} t/m{' '}
                      {moduleData.year_to}, afkomstig van{' '}
                      <a
                        href={section.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--navy-medium)] hover:underline"
                      >
                        {section.sourceLabel}
                      </a>
                      .
                    </p>
                  </section>
                )
              }

              // Matrix type
              const entities = getEntityData(section.module)
              if (entities.length === 0) return null
              const hasSources = !!section.sources

              return (
                <section key={section.module}>
                  <h2
                    className="text-xl font-semibold text-[var(--navy-dark)] mb-2"
                    style={{ fontFamily: 'var(--font-heading), sans-serif' }}
                  >
                    {section.title}
                  </h2>
                  <p className="text-[var(--foreground)] text-base mb-4">
                    {section.description}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-[var(--border)]">
                      <thead className="bg-[var(--gray-light)]">
                        <tr>
                          <th className={thStyle}>{section.entityLabel}</th>
                          {AVAILABLE_YEARS.map(year => (
                            <th key={year} className={yearThStyle}>
                              {year}
                            </th>
                          ))}
                          {hasSources && (
                            <th className={thStyle}>Bron</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {entities.map(entity => (
                          <tr key={entity.entity_name}>
                            <td className={tdStyle}>{entity.entity_name}</td>
                            {AVAILABLE_YEARS.map(year => (
                              <td key={year} className={yearTdStyle}>
                                {year >= entity.year_from &&
                                year <= entity.year_to ? (
                                  <span className="text-green-600 font-bold">
                                    ✓
                                  </span>
                                ) : null}
                              </td>
                            ))}
                            {hasSources && (
                              <td className={tdStyle}>
                                {section.sources?.[
                                  entity.entity_name ?? ''
                                ] ? (
                                  <a
                                    href={
                                      section.sources[
                                        entity.entity_name ?? ''
                                      ]
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--navy-medium)] hover:underline text-sm"
                                  >
                                    Bron
                                  </a>
                                ) : null}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
