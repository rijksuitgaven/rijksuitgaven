import Link from 'next/link'

// UX-027: Post-login landing page — Enhanced Module Hub
// Grouped by: Ontvangers (who receives) / Kosten (what it costs)

const ontvangers = [
  {
    name: 'integraal',
    display: 'Zoeken in alle modules',
    description: 'Alle modules gecombineerd op ontvanger.',
    stat: '€1.621 mld · 463.000+ ontvangers',
  },
  {
    name: 'instrumenten',
    display: 'Financiële Instrumenten',
    description: 'Subsidies, bijdragen en bekostigingen aan organisaties en medeoverheden.',
    stat: '€1.474 mld · 2016–2024',
  },
  {
    name: 'inkoop',
    display: 'Inkoopuitgaven',
    description: 'Goederen en diensten ingekocht door de rijksoverheid.',
    stat: '€85 mld · 2017–2023',
  },
  {
    name: 'provincie',
    display: 'Provinciale subsidieregisters',
    description: 'Subsidieregisters van Drenthe, Friesland, Gelderland, Limburg, Noord-Brabant, Noord-Holland, Overijssel, Utrecht, Zeeland en Zuid-Holland.',
    stat: '€14 mld · 2018–2024',
  },
  {
    name: 'gemeente',
    display: 'Gemeentelijke subsidieregisters',
    description: 'Subsidieregisters van Almere, Amersfoort, Amsterdam, Breda, Den Haag, Groningen, Haarlem, Tilburg en Utrecht.',
    stat: '€13 mld · 2018–2024',
  },
  {
    name: 'publiek',
    display: 'Publieke uitvoeringsorganisaties en kennisinstellingen',
    description: 'Uitgaven van RVO, ZonMW, NWO en COA.',
    stat: '€12 mld · 2018–2024',
  },
]

const kosten = [
  {
    name: 'apparaat',
    display: 'Apparaatsuitgaven',
    description: 'Personeel- en materieelkosten van de rijksoverheid.',
    stat: '€147 mld · 2016–2024',
  },
]

function ModuleCard({ module }: { module: typeof ontvangers[number] }) {
  return (
    <Link
      href={`/${module.name}`}
      className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--navy-medium)] hover:shadow-md transition-all"
    >
      <h3 className="text-xl font-semibold text-[var(--navy-dark)]">
        {module.display}
      </h3>
      <p className="text-base text-[var(--muted-foreground)] mt-1">
        {module.description}
      </p>
      <p className="text-sm text-[var(--navy-medium)] mt-2">
        {module.stat}
      </p>
    </Link>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Welcome bar */}
      <section className="border-b border-[var(--border)] bg-[var(--gray-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xl text-[var(--navy-dark)]">
            Doorzoek en vergelijk rijksoverheidsuitgaven vanaf 2016.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Ontvangers section */}
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-4">
          Ontvangers
        </p>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {ontvangers.slice(0, 6).map((module) => (
            <ModuleCard key={module.name} module={module} />
          ))}
        </div>

        {/* Kosten section */}
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-4 mt-10">
          Kosten
        </p>
        <ModuleCard module={kosten[0]} />
      </main>
    </div>
  )
}
