import Link from 'next/link'

export const metadata = {
  title: 'Over Rijksuitgaven',
  description: 'Wij maken overheidsuitgaven doorzoekbaar, vergelijkbaar en begrijpelijk.',
}

export default function OverPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Over Rijksuitgaven
          </h1>
          <p className="text-[var(--navy-dark)]/70 mt-3 text-lg leading-relaxed max-w-2xl">
            Wij maken overheidsuitgaven doorzoekbaar, vergelijkbaar en begrijpelijk. Van de rijksbegroting tot de laatste regeling.
          </p>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* Onze missie */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Onze missie
            </h2>
            <p className="text-[var(--foreground)] mb-4 leading-relaxed">
              Rijksuitgaven maakt alle overheidsbestedingen snel doorzoekbaar en vergelijkbaar. Op ons platform doorzoekt u meer dan €1.700 miljard aan uitgaven van de Rijksoverheid en medeoverheden — van totaalbedragen per ontvanger tot de onderliggende regelingen en artikelen.
            </p>
            <p className="text-[var(--foreground)] leading-relaxed">
              Wij geloven dat de kracht van overheidsdata pas tot leven komt als professionals er duiding aan geven. Daarom ontwikkelen wij Rijksuitgaven samen met onze abonnees. Zij bepalen mede welke databronnen prioriteit krijgen en helpen ons het platform te verbeteren met hun feedback.
            </p>
          </section>

          {/* Voor wie */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-6" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Voor wie is Rijksuitgaven?
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-[var(--navy-dark)] mb-1">
                  Raadsleden en Statenleden
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  Vergelijk de uitgaven van uw gemeente of provincie met die van anderen. Formuleer onderbouwde vragen aan het college en controleer of begrotingen worden waargemaakt met actuele realisatiecijfers.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--navy-dark)] mb-1">
                  Politieke partijen
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  Directe inzage in de werkelijke realisatie van begrotingen, wetten en regelingen. Gebruik de data voor Kamervragen, moties of beleidsonderbouwing.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--navy-dark)] mb-1">
                  Journalisten en onderzoekers
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  Doorzoek 463.000+ ontvangers in 6 databronnen. Ontdek patronen, vergelijk bedragen over 9 begrotingsjaren en onderbouw uw verhaal met exacte cijfers — in plaats van uren zoeken in versnipperde PDF's.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--navy-dark)] mb-1">
                  Bedrijven en non-profits
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  Vind kansen in subsidies en aanbestedingen. Zie welke organisaties in uw sector al overheidsgeld ontvangen en maak betere strategische keuzes op basis van actuele data.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--navy-dark)] mb-1">
                  Academici en studenten
                </h3>
                <p className="text-[var(--foreground)] leading-relaxed">
                  Gebruik betrouwbare officiële overheidsdata voor onderzoek en onderwijs over publieke financiën. Exporteer datasets en vergelijk uitgavenpatronen over meerdere jaren.
                </p>
              </div>
            </div>
          </section>

          {/* Onafhankelijk */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Onafhankelijk en objectief
            </h2>
            <p className="text-[var(--foreground)] mb-4 leading-relaxed">
              Rijksuitgaven is onafhankelijk en objectief. Om dat ook in de toekomst te kunnen blijven, bieden wij onze dienstverlening en verrijkte data aan in de vorm van een betaald abonnement.
            </p>
            <p className="text-[var(--foreground)] leading-relaxed">
              Met de inkomsten uit abonnementen kan Rijksuitgaven haar diensten uitbreiden, nieuwe databronnen toevoegen en haar missie realiseren: alle overheidsuitgaven doorzoekbaar en vergelijkbaar maken.
            </p>
          </section>

          {/* Bronnen */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Onze bronnen
            </h2>
            <p className="text-[var(--foreground)] leading-relaxed">
              Rijksuitgaven werkt uitsluitend met officiële data van de Rijksoverheid, provincies, gemeenten en publieke uitvoeringsorganisaties en kennisinstellingen. De landelijke begrotings- en realisatiecijfers worden jaarlijks bijgewerkt rond Verantwoordingsdag. Data van medeoverheden en uitvoeringsorganisaties wordt toegevoegd zodra deze beschikbaar is.
            </p>
          </section>

          {/* Contact CTA */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Neem contact op
            </h2>
            <p className="text-[var(--foreground)] leading-relaxed">
              Heeft u vragen, suggesties of interesse in een abonnement? Neem contact met ons op via{' '}
              <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline underline-offset-4">
                contact@rijksuitgaven.nl
              </a>{' '}
              of bel{' '}
              <a href="tel:0850806960" className="text-[var(--navy-medium)] hover:underline underline-offset-4">
                085-0806960
              </a>.
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-8 mt-12">
        <div className="max-w-4xl mx-auto text-center text-sm text-[var(--muted-foreground)]">
          <p>&copy; {new Date().getFullYear()} Rijksuitgaven.nl</p>
        </div>
      </footer>
    </div>
  )
}
