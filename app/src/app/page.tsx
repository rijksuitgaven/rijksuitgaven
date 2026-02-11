import Link from 'next/link'

// UX-027: Post-login landing page — Enhanced Module Hub
const modules = [
  {
    name: 'instrumenten',
    display: 'Financiële Instrumenten',
    description: 'Subsidies, bijdragen en bekostigingen aan organisaties en medeoverheden.',
    stat: '€1,5 biljoen · 2016–2024',
  },
  {
    name: 'apparaat',
    display: 'Apparaatsuitgaven',
    description: 'Personeel- en materieelkosten van de rijksoverheid.',
    stat: '€147 mld · 2016–2024',
  },
  {
    name: 'inkoop',
    display: 'Inkoopuitgaven',
    description: 'Goederen en diensten ingekocht door de rijksoverheid.',
    stat: '€85 mld · 2017–2023',
  },
  {
    name: 'publiek',
    display: 'Publieke Organisaties',
    description: 'Uitgaven van RVO, ZonMW, NWO, COA en andere organisaties.',
    stat: '€12 mld · 2018–2024',
  },
  {
    name: 'provincie',
    display: 'Provinciale Subsidies',
    description: 'Subsidieregisters van 10 provincies.',
    stat: '10 provincies · 2018–2024',
  },
  {
    name: 'gemeente',
    display: 'Gemeentelijke Subsidies',
    description: 'Subsidieregisters van 9 gemeentes.',
    stat: '9 gemeentes · 2018–2024',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Welcome bar */}
      <section className="border-b border-[var(--border)] bg-[var(--gray-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-lg text-[var(--navy-dark)]">
            Doorzoek en vergelijk rijksoverheidsuitgaven vanaf 2016.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Integraal — full-width featured card */}
        <Link
          href="/integraal"
          className="block border border-[var(--pink)] bg-[var(--pink)]/5 rounded-lg p-6 hover:bg-[var(--pink)]/10 transition-all mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-dark)]">
                Integraal Overzicht
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Alle modules gecombineerd — ontdek welke ontvangers in meerdere databronnen voorkomen.
              </p>
              <p className="text-xs text-[var(--navy-medium)] mt-2">
                463.000+ ontvangers · 6 databronnen
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--pink)] border border-[var(--pink)] rounded-md hover:bg-[var(--pink)] hover:text-white transition-colors">
              Bekijk
            </span>
          </div>
        </Link>

        {/* Module grid — 2 columns */}
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.name}
              href={`/${module.name}`}
              className="block border border-[var(--border)] rounded-lg p-6 hover:border-[var(--navy-medium)] hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold text-[var(--navy-dark)]">
                {module.display}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {module.description}
              </p>
              <p className="text-xs text-[var(--navy-medium)] mt-2">
                {module.stat}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
