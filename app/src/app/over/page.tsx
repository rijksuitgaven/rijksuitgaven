import Link from 'next/link'
import { ScrollReveal } from '@/components/homepage'

export const metadata = {
  title: 'Over Rijksuitgaven',
  description: 'Wij maken overheidsuitgaven doorzoekbaar, vergelijkbaar en begrijpelijk.',
}

export default function OverPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-8 md:pt-12 pb-12 md:pb-16">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] text-[var(--navy-medium)] hover:text-[var(--navy-dark)] transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pink)] focus-visible:ring-offset-2 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Terug naar home
          </Link>
          <ScrollReveal>
            <h1
              className="text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-tight text-[var(--pink)]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Over Rijksuitgaven
            </h1>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mt-6 text-[20px] md:text-[24px] font-normal leading-[1.5] text-[var(--navy-dark)]/80 max-w-[640px]">
              Wij maken overheidsuitgaven doorzoekbaar, vergelijkbaar en begrijpelijk. Van de rijksbegroting tot de laatste regeling.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stat Strip */}
      <section className="bg-white pb-6 md:pb-10">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12">
              <div className="border-l-[3px] border-l-[var(--pink)] pl-4 md:pl-5">
                <p className="text-[22px] md:text-[28px] font-bold leading-[1.1] text-[var(--navy-dark)] tracking-tight" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                  &euro;1.700+ mld
                </p>
                <p className="text-[13px] uppercase tracking-[0.1em] text-[var(--navy-medium)] mt-1.5">aan uitgaven</p>
              </div>
              <div className="border-l-[3px] border-l-[var(--pink)] pl-4 md:pl-5">
                <p className="text-[22px] md:text-[28px] font-bold leading-[1.1] text-[var(--navy-dark)] tracking-tight" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                  463.000+
                </p>
                <p className="text-[13px] uppercase tracking-[0.1em] text-[var(--navy-medium)] mt-1.5">ontvangers</p>
              </div>
              <div className="border-l-[3px] border-l-[var(--pink)] pl-4 md:pl-5">
                <p className="text-[22px] md:text-[28px] font-bold leading-[1.1] text-[var(--navy-dark)] tracking-tight" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                  9
                </p>
                <p className="text-[13px] uppercase tracking-[0.1em] text-[var(--navy-medium)] mt-1.5">begrotingsjaren</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Onze missie */}
      <section className="bg-white pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <h2
              className="text-[28px] md:text-[38px] font-bold leading-[1.1] tracking-tight text-[var(--navy-dark)]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Onze missie
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-6 max-w-[720px]">
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[var(--navy-dark)]/80 mb-5">
                Rijksuitgaven maakt alle overheidsbestedingen snel doorzoekbaar en vergelijkbaar. Op ons platform doorzoekt u meer dan &euro;1.700 miljard aan uitgaven van de Rijksoverheid en medeoverheden &mdash; van totaalbedragen per ontvanger tot de onderliggende regelingen en artikelen.
              </p>
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[var(--navy-dark)]/80">
                Wij geloven dat de kracht van overheidsdata pas tot leven komt als professionals er duiding aan geven. Daarom ontwikkelen wij Rijksuitgaven samen met onze abonnees. Zij bepalen mede welke databronnen prioriteit krijgen en helpen ons het platform te verbeteren met hun feedback.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Voor wie is Rijksuitgaven? */}
      <section className="bg-gradient-to-b from-[#f8f9fb] to-[#eef2f7] pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <h2
              className="text-[28px] md:text-[38px] font-bold leading-[1.1] tracking-tight text-[var(--pink)]"
              style={{ fontFamily: 'var(--font-heading), sans-serif', textWrap: 'balance' } as React.CSSProperties}
            >
              Voor wie is Rijksuitgaven?
            </h2>
          </ScrollReveal>

          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {/* Raadsleden */}
            <ScrollReveal>
              <div className="bg-white rounded-xl p-6 h-full shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1 border-t-[3px] border-t-[var(--pink)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">
                  Raadsleden en Statenleden
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/70">
                  Vergelijk de uitgaven van uw gemeente of provincie met die van anderen. Formuleer onderbouwde vragen aan het college en controleer of begrotingen worden waargemaakt met actuele realisatiecijfers.
                </p>
              </div>
            </ScrollReveal>

            {/* Politiek */}
            <ScrollReveal>
              <div className="bg-white rounded-xl p-6 h-full shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1 border-t-[3px] border-t-[var(--pink)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">
                  Politieke partijen
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/70">
                  Directe inzage in de werkelijke realisatie van begrotingen, wetten en regelingen. Gebruik de data voor Kamervragen, moties of beleidsonderbouwing.
                </p>
              </div>
            </ScrollReveal>

            {/* Journalisten */}
            <ScrollReveal>
              <div className="bg-white rounded-xl p-6 h-full shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1 border-t-[3px] border-t-[var(--pink)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">
                  Journalisten en onderzoekers
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/70">
                  Doorzoek 463.000+ ontvangers. Ontdek patronen, vergelijk bedragen over 9 begrotingsjaren en onderbouw uw verhaal met exacte cijfers &mdash; in plaats van uren zoeken in versnipperde PDF&rsquo;s.
                </p>
              </div>
            </ScrollReveal>

            {/* Bedrijven */}
            <ScrollReveal>
              <div className="bg-white rounded-xl p-6 h-full shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1 border-t-[3px] border-t-[var(--pink)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">
                  Bedrijven en non-profits
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/70">
                  Vind kansen in subsidies en aanbestedingen. Zie welke organisaties in uw sector al overheidsgeld ontvangen en maak betere strategische keuzes op basis van actuele data.
                </p>
              </div>
            </ScrollReveal>

            {/* Academici */}
            <ScrollReveal>
              <div className="bg-white rounded-xl p-6 h-full shadow-[0_0_40px_rgba(14,50,97,0.06),0_1px_3px_rgba(14,50,97,0.08)] hover:shadow-[0_20px_60px_rgba(14,50,97,0.12),0_1px_3px_rgba(14,50,97,0.08)] transition-all duration-300 hover:-translate-y-1 border-t-[3px] border-t-[var(--pink)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--pink)]/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[var(--pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold leading-[1.3] text-[var(--navy-dark)]">
                  Academici en studenten
                </h3>
                <p className="mt-3 text-[15px] leading-[1.7] text-[var(--navy-dark)]/70">
                  Gebruik betrouwbare offici&euml;le overheidsdata voor onderzoek en onderwijs over publieke financi&euml;n. Exporteer datasets en vergelijk uitgavenpatronen over meerdere jaren.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Onafhankelijk en objectief */}
      <section className="bg-white pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <h2
              className="text-[28px] md:text-[38px] font-bold leading-[1.1] tracking-tight text-[var(--navy-dark)]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Onafhankelijk en objectief
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="mt-6 max-w-[720px]">
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[var(--navy-dark)]/80 mb-5">
                Rijksuitgaven is onafhankelijk en objectief. Om dat ook in de toekomst te kunnen blijven, bieden wij onze dienstverlening en verrijkte data aan in de vorm van een betaald abonnement.
              </p>
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-[var(--navy-dark)]/80">
                Met de inkomsten uit abonnementen kan Rijksuitgaven haar diensten uitbreiden, nieuwe databronnen toevoegen en haar missie realiseren: alle overheidsuitgaven doorzoekbaar en vergelijkbaar maken.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Onze bronnen */}
      <section className="bg-[#f8f9fb] py-16 md:py-20">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <h2
              className="text-[28px] md:text-[38px] font-bold leading-[1.1] tracking-tight text-[var(--navy-dark)]"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Onze bronnen
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mt-6 text-[17px] md:text-[18px] leading-[1.7] text-[var(--navy-dark)]/80 max-w-[720px]">
              Rijksuitgaven werkt uitsluitend met offici&euml;le data van de Rijksoverheid, provincies, gemeenten en publieke uitvoeringsorganisaties en kennisinstellingen. De landelijke begrotings- en realisatiecijfers worden jaarlijks bijgewerkt rond Verantwoordingsdag. Data van medeoverheden en uitvoeringsorganisaties wordt toegevoegd zodra deze beschikbaar is.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Neem contact op — CTA band */}
      <section className="bg-[var(--pink)] py-14 md:py-20">
        <div className="max-w-[1080px] mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <h2
              className="text-[30px] md:text-[36px] font-bold leading-[1.3] text-white"
              style={{ fontFamily: 'var(--font-heading), sans-serif' }}
            >
              Neem contact op
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mt-5 text-[18px] md:text-[20px] leading-[1.6] text-white/90 max-w-[640px]">
              Heeft u vragen, suggesties of interesse in een abonnement? Neem contact met ons op via{' '}
              <a
                href="mailto:contact@rijksuitgaven.nl"
                className="text-white underline underline-offset-4 hover:no-underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pink)] rounded"
              >
                contact@rijksuitgaven.nl
              </a>{' '}
              of bel{' '}
              <a
                href="tel:0850806960"
                className="text-white underline underline-offset-4 hover:no-underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pink)] rounded"
              >
                085-0806960
              </a>.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
