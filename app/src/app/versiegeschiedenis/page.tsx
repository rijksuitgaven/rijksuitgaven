import Link from 'next/link'
import { TrackPageView } from '@/components/analytics/track-page-view'

export const metadata = {
  title: 'Versiegeschiedenis - Rijksuitgaven.nl',
  description: 'Alle verbeteringen aan Rijksuitgaven.nl — wat er is veranderd en waarom het voor u relevant is.',
}

export default function VersiegeschiedenisPage() {
  return (
    <div className="min-h-screen bg-white">
      <TrackPageView page="versiegeschiedenis" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Versiegeschiedenis
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Alle verbeteringen aan Rijksuitgaven.nl — wat er is veranderd en waarom het voor u relevant is.
          </p>
        </div>

        <article className="prose prose-slate max-w-none">

          {/* V2.3 */}
          <section className="mb-12">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-xl font-semibold text-[var(--navy-dark)] m-0" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                V2.3
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">27 februari 2026</span>
            </div>

            <h3 className="text-lg font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Nauwkeurigere zoekresultaten
            </h3>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3">
              <li>
                <strong>Gefilterde bedragen bij zoekresultaten:</strong> Zoekt u op een regeling of artikel? De bedragen tonen nu precies wat bij die zoekterm hoort. Zo ziet u direct de relevante omvang per ontvanger.
              </li>
            </ul>
          </section>

          <hr className="border-[var(--border)] my-8" />

          {/* V2.2 */}
          <section className="mb-12">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-xl font-semibold text-[var(--navy-dark)] m-0" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                V2.2
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">24 februari 2026</span>
            </div>

            <h3 className="text-lg font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Sorteer direct op de hoogste bedragen
            </h3>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3">
              <li>
                <strong>Hoogste bedragen eerst:</strong> Klik op een kolomkop en de tabel sorteert direct van hoog naar laag. Zo ziet u in één klik wie de meeste subsidie ontvangt, welke leverancier het grootste contract heeft, of waar het budget het sterkst is gestegen.
              </li>
              <li>
                <strong>Drie stappen:</strong> Eerste klik sorteert van hoog naar laag. Tweede klik draait om naar laag naar hoog. Derde klik zet de sortering uit.
              </li>
            </ul>
          </section>

          <hr className="border-[var(--border)] my-8" />

          {/* V2.1 */}
          <section className="mb-12">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-xl font-semibold text-[var(--navy-dark)] m-0" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                V2.1
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">21 februari 2026</span>
            </div>

            <h3 className="text-lg font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Slimmer zoeken met meerdere woorden
            </h3>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3">
              <li>
                <strong>Woorden in willekeurige volgorde:</strong> Zoek op <code className="bg-[var(--gray-light)] px-1.5 py-0.5 rounded text-sm">rode kruis</code> en u vindt alle ontvangers waarin beide woorden voorkomen — ongeacht waar ze staan.
              </li>
              <li>
                <strong>Exacte woordgroep zoeken:</strong> Zet aanhalingstekens om woorden die u als groep wilt zoeken. <code className="bg-[var(--gray-light)] px-1.5 py-0.5 rounded text-sm">&quot;rode kruis&quot;</code> vindt alleen resultaten waar deze woorden direct naast elkaar staan, in precies die volgorde. Handig als u een specifieke naam of regeling zoekt.
              </li>
              <li>
                <strong>Zoeken met sterretje:</strong> Typ <code className="bg-[var(--gray-light)] px-1.5 py-0.5 rounded text-sm">prorail*</code> om alles te vinden dat begint met &quot;prorail&quot; — ProRail B.V., Prorail Holding, enzovoort.
              </li>
            </ul>
          </section>

          <hr className="border-[var(--border)] my-8" />

          {/* V2.0 */}
          <section className="mb-12">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-xl font-semibold text-[var(--navy-dark)] m-0" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
                V2.0
              </h2>
              <span className="text-sm text-[var(--muted-foreground)]">20 februari 2026</span>
            </div>

            <h3 className="text-lg font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Rijksuitgaven.nl is volledig opnieuw gebouwd
            </h3>
            <p className="text-[var(--foreground)] mb-8">
              Het platform dat u kent van de afgelopen jaren is vanaf de grond opnieuw opgebouwd. Sneller, slimmer en met meer mogelijkheden om overheidsuitgaven te doorzoeken en te vergelijken. Hieronder leest u wat er nieuw is — en wat dat voor uw werk betekent.
            </p>

            {/* Zoeken */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Vind in milliseconden wat u zoekt
            </h4>
            <p className="text-[var(--foreground)] mb-3">
              U ziet resultaten terwijl u typt.
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3 mb-8">
              <li>
                <strong>Autocomplete uit alle bronnen:</strong> Zodra u begint te typen krijgt u suggesties uit alle databronnen tegelijk. U ziet direct of een ontvanger voorkomt in de Rijksbegroting, bij gemeenten, provincies of publieke uitvoeringsorganisaties.
              </li>
              <li>
                <strong>Het systeem begrijpt Nederlands:</strong> Zoek op <code className="bg-[var(--gray-light)] px-1.5 py-0.5 rounded text-sm">politie</code> en u vindt &quot;Nationale Politie&quot; en &quot;Politieacademie&quot;, maar niet &quot;Politieke beweging DENK&quot;. Het systeem herkent Nederlandse woordgrenzen en voorkomt irrelevante resultaten.
              </li>
              <li>
                <strong>Integraal doorzoeken:</strong> Doorzoek alle databronnen in één keer. U ziet per ontvanger in welke bronnen deze voorkomt en hoeveel betalingen er zijn.
              </li>
              <li>
                <strong>Zie waar uw zoekterm ook voorkomt:</strong> De &quot;Komt ook voor in&quot; kolom toont of uw zoekterm ook in een regeling, omschrijving of ander veld staat. Zo ontdekt u verbanden die u anders zou missen.
              </li>
            </ul>

            {/* Data */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Negen jaar overheidsuitgaven in één overzicht
            </h4>
            <p className="text-[var(--foreground)] mb-3">
              Alle overheidsuitgaven van 2016 tot en met 2024, gebundeld in meerdere datamodules en één integraal overzicht.
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-8">
              <li><strong>Financiële Instrumenten</strong> — subsidies en bijdragen vanuit de Rijksbegroting</li>
              <li><strong>Apparaatsuitgaven</strong> — kosten van de rijksoverheid zelf</li>
              <li><strong>Inkoopuitgaven</strong> — wat de overheid inkoopt bij leveranciers</li>
              <li><strong>Provinciale Subsidieregisters</strong> — subsidies verstrekt door provincies</li>
              <li><strong>Gemeentelijke Subsidieregisters</strong> — subsidies verstrekt door gemeenten</li>
              <li><strong>Publieke Uitvoeringsorganisaties</strong> — bestedingen van RVO, COA, NWO en ZonMW</li>
              <li><strong>Integraal</strong> — alle bronnen gecombineerd, per ontvanger</li>
            </ul>

            {/* Absolute bedragen */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Elk bedrag volledig uitgeschreven
            </h4>
            <p className="text-[var(--foreground)] mb-8">
              Alle bedragen worden als <strong>absolute getallen</strong> getoond. U ziet exact wat er is uitgegeven, tot op de euro — geen afkortingen, geen &quot;x 1.000&quot;. Jaarbedragen staan naast elkaar in kolommen, met een totaalkolom.
            </p>

            {/* Anomalieën */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Opvallende verschuivingen in één oogopslag
            </h4>
            <p className="text-[var(--foreground)] mb-8">
              Cellen met meer dan 50% jaar-op-jaar verandering worden rood gemarkeerd. Beweeg uw muis over de cel om het exacte percentage te zien. Zo ziet u direct waar budgetten sterk zijn gestegen of gedaald.
            </p>

            {/* Databeschikbaarheid */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Weet precies welke data beschikbaar is
            </h4>
            <p className="text-[var(--foreground)] mb-3">
              Niet elke databron dekt alle jaren. Het platform is daar transparant over:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3 mb-8">
              <li>
                <strong>Streepje betekent &quot;geen data&quot;:</strong> Jaren waarvoor geen data bestaat tonen een streepje (—) in plaats van €0. Zo weet u altijd of een nul een werkelijk bedrag is of dat er simpelweg geen data voor dat jaar bestaat.
              </li>
              <li>
                <strong>Datasetsoverzicht:</strong> Een overzichtspagina toont per databron, entiteit en jaar precies wat er beschikbaar is.
              </li>
            </ul>

            {/* Filteren */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Filter tot u precies vindt wat u nodig heeft
            </h4>
            <p className="text-[var(--foreground)] mb-3">
              Elke module heeft eigen filters waarmee u snel kunt inzoomen. Combineer meerdere filters tegelijk en de resultaten worden direct bijgewerkt.
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3 mb-8">
              <li>
                <strong>Filters die op elkaar reageren:</strong> Selecteer een provincie en de overige filtervelden tonen automatisch alleen de opties die daarbinnen relevant zijn, met aantallen. Zo filtert u nooit naar een lege selectie.
              </li>
              <li>
                <strong>Klik om te filteren:</strong> Ziet u een interessante regeling of gemeente in de tabel? Klik erop en de tabel filtert direct op die waarde.
              </li>
              <li>
                <strong>Kies uw eigen kolommen:</strong> Bepaal via de Kolommen-knop welke extra informatie u in de tabel wilt zien — artikel, regeling, gemeente, categorie of andere velden.
              </li>
            </ul>

            {/* Details */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Zoom in op de details achter de bedragen
            </h4>
            <p className="text-[var(--foreground)] mb-3">
              Klik op een ontvanger om alle onderliggende betalingen te zien. De details klappen direct onder de rij uit.
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-3 mb-8">
              <li>
                <strong>Groepeer op elk veld:</strong> Bekijk de betalingen gegroepeerd op artikel, regeling, gemeente of een ander veld. Wissel tussen groeperingen om het bedrag vanuit verschillende invalshoeken te bekijken.
              </li>
              <li>
                <strong>Zoek een ontvanger op Google:</strong> Eén klik op het linkicoon naast de naam opent Google met die ontvangernaam. Handig voor snel achtergrondonderzoek.
              </li>
            </ul>

            {/* Exporteren */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Exporteer data voor uw eigen analyses
            </h4>
            <p className="text-[var(--foreground)] mb-8">
              Download tot 500 rijen naar Excel (.xlsx) of CSV, inclusief alle zichtbare kolommen en jaarbedragen. Het bestand wordt automatisch benoemd met de module en datum, zodat u uw exports geordend houdt.
            </p>

            {/* Account */}
            <h4 className="text-base font-semibold text-[var(--navy-dark)] mb-3" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Inloggen zonder wachtwoord
            </h4>
            <p className="text-[var(--foreground)]">
              Log in via een link die u per e-mail ontvangt — geen wachtwoord nodig, geen wachtwoord dat u kunt vergeten. U heeft een persoonlijk profiel met uw abonnementsgegevens en kunt direct vanuit het platform feedback sturen.
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
