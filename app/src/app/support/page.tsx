'use client'

import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Ondersteuning
          </h1>
          <p className="text-[var(--muted-foreground)] mt-2 text-base">
            Alles wat u nodig heeft om het meeste uit Rijksuitgaven te halen.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={['aan-de-slag']} className="w-full">
          {/* Section 1: Aan de slag */}
          <AccordionItem value="aan-de-slag" className="border-b border-[var(--border)]">
            <AccordionTrigger className="text-lg font-semibold text-[var(--navy-dark)] hover:no-underline py-5">
              Aan de slag
            </AccordionTrigger>
            <AccordionContent className="text-[var(--foreground)] text-base leading-relaxed">
              <div className="space-y-4 pb-2">
                <p>
                  Na het inloggen komt u op de <strong>module hub</strong>: het startpunt van het platform.
                  Hier ziet u alle beschikbare modules met een korte beschrijving en het totaalbedrag aan uitgaven.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Zoeken</h3>
                <p>
                  Klik op een module om de data te openen. Bovenaan elke module vindt u de zoekbalk.
                  Typ een naam en druk op <strong>Enter</strong> of klik op een suggestie uit de autocomplete-lijst.
                  De resultaten worden direct getoond in de tabel.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Geconsolideerde weergave</h3>
                <p>
                  De tabel toont per ontvanger het <strong>totaalbedrag per jaar</strong>.
                  Alle betalingen vanuit verschillende regelingen en instrumenten worden bij elkaar opgeteld,
                  zodat u in &eacute;&eacute;n oogopslag ziet hoeveel een ontvanger per jaar heeft ontvangen.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Rij uitklappen</h3>
                <p>
                  Klik op een rij om de details te bekijken. U ziet dan een uitsplitsing van alle
                  onderliggende betalingen: per regeling, instrument, artikel of andere dimensie,
                  afhankelijk van de module.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Integraal zoeken</h3>
                <p>
                  De module <strong>Zoeken in alle modules</strong> doorzoekt alle databronnen tegelijk.
                  Handig als u niet weet in welke module een ontvanger voorkomt.
                  De kolom &ldquo;Gevonden in&rdquo; toont in welke module(s) de ontvanger is aangetroffen.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Modules */}
          <AccordionItem value="modules" className="border-b border-[var(--border)]">
            <AccordionTrigger className="text-lg font-semibold text-[var(--navy-dark)] hover:no-underline py-5">
              Modules
            </AccordionTrigger>
            <AccordionContent className="text-[var(--foreground)] text-base leading-relaxed">
              <div className="space-y-4 pb-2">
                <p>
                  Het platform bevat zeven modules, elk gericht op een specifiek type overheidsuitgaven.
                </p>

                <div className="space-y-5 pt-2">
                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Financiële Instrumenten</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2016&ndash;2024</p>
                    <p className="mt-1">
                      Subsidies, bijdragen en bekostigingen aan organisaties en medeoverheden.
                      Bevat alle financiële instrumenten uit de rijksbegroting.
                      Filteren op artikel, regeling en instrument.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Apparaatsuitgaven</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2016&ndash;2024</p>
                    <p className="mt-1">
                      Personeel- en materieelkosten van de rijksoverheid.
                      Bevat de interne bedrijfsvoeringskosten per begrotingsartikel.
                      Filteren op artikel en kostensoort.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Inkoopuitgaven</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2017&ndash;2023</p>
                    <p className="mt-1">
                      Goederen en diensten ingekocht door de rijksoverheid.
                      Bevat leveranciers, inkopcategorie&euml;n en bestedingsstaffels.
                      Filteren op categorie en staffel.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Provinciale subsidieregisters</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2018&ndash;2024</p>
                    <p className="mt-1">
                      Subsidieregisters van Drenthe, Friesland, Gelderland, Limburg, Noord-Brabant,
                      Noord-Holland, Overijssel, Utrecht, Zeeland en Zuid-Holland.
                      Filteren op provincie en omschrijving.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Gemeentelijke subsidieregisters</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2018&ndash;2024</p>
                    <p className="mt-1">
                      Subsidieregisters van Almere, Amersfoort, Amsterdam, Breda, Den Haag,
                      Groningen, Haarlem, Tilburg en Utrecht.
                      Filteren op gemeente en omschrijving.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Publieke uitvoeringsorganisaties en kennisinstellingen</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-0.5">2018&ndash;2024</p>
                    <p className="mt-1">
                      Uitgaven van RVO, ZonMW, NWO en COA.
                      Bevat subsidies en bijdragen verstrekt door publieke uitvoeringsorganisaties.
                      Filteren op organisatie.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[var(--navy-dark)]">Zoeken in alle modules</h3>
                    <p className="mt-1">
                      Doorzoekt alle bovenstaande modules tegelijk op ontvangernaam.
                      Toont een geconsolideerd overzicht per ontvanger met het aantal betalingen
                      en in welke module(s) de ontvanger voorkomt.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Exporteren */}
          <AccordionItem value="exporteren" className="border-b border-[var(--border)]">
            <AccordionTrigger className="text-lg font-semibold text-[var(--navy-dark)] hover:no-underline py-5">
              Exporteren
            </AccordionTrigger>
            <AccordionContent className="text-[var(--foreground)] text-base leading-relaxed">
              <div className="space-y-4 pb-2">
                <p>
                  U kunt zoekresultaten exporteren als <strong>CSV</strong> of <strong>Excel (XLS)</strong> bestand
                  via de exportknop rechtsbovenaan de tabel.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Exportlimiet</h3>
                <p>
                  Per export kunt u maximaal <strong>500 rijen</strong> downloaden.
                  Dit is een bewuste limiet om de integriteit van de databank te beschermen.
                  Gebruik de zoek- en filterfuncties om uw selectie te verfijnen voordat u exporteert.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Wat wordt ge&euml;xporteerd?</h3>
                <p>
                  Het exportbestand bevat dezelfde kolommen die u in de tabel ziet, inclusief
                  de jaarbedragen. Filters die u heeft ingesteld worden meegenomen in de export.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Filters */}
          <AccordionItem value="filters" className="border-b border-[var(--border)]">
            <AccordionTrigger className="text-lg font-semibold text-[var(--navy-dark)] hover:no-underline py-5">
              Filteren
            </AccordionTrigger>
            <AccordionContent className="text-[var(--foreground)] text-base leading-relaxed">
              <div className="space-y-4 pb-2">
                <p>
                  Elke module biedt filteropties om de resultaten te verfijnen.
                  De beschikbare filters verschillen per module en zijn afgestemd op de onderliggende data.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Hoe werkt filteren?</h3>
                <p>
                  Klik op een filterveld om de beschikbare waarden te zien.
                  De filteropties passen zich automatisch aan: wanneer u een filter instelt,
                  worden de overige filteropties bijgewerkt op basis van uw selectie.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Filters combineren</h3>
                <p>
                  U kunt meerdere filters tegelijk gebruiken. Alle filters werken cumulatief:
                  hoe meer filters u instelt, hoe specifieker de resultaten.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Filters wissen</h3>
                <p>
                  Klik op het kruisje naast een actief filter om dit filter te verwijderen,
                  of gebruik de zoekbalk om opnieuw te beginnen met een nieuwe zoekopdracht.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: Uw account */}
          <AccordionItem value="account" className="border-b border-[var(--border)]">
            <AccordionTrigger className="text-lg font-semibold text-[var(--navy-dark)] hover:no-underline py-5">
              Uw account
            </AccordionTrigger>
            <AccordionContent className="text-[var(--foreground)] text-base leading-relaxed">
              <div className="space-y-4 pb-2">
                <h3 className="font-semibold text-[var(--navy-dark)]">Inloggen</h3>
                <p>
                  Rijksuitgaven maakt gebruik van <strong>inloglinks</strong> in plaats van wachtwoorden.
                  Voer uw e-mailadres in op de loginpagina en u ontvangt een eenmalige link waarmee u direct inlogt.
                  De link is 1 uur geldig.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Abonnement</h3>
                <p>
                  Uw abonnement wordt beheerd door de beheerder van uw organisatie.
                  Neem contact op met uw beheerder voor vragen over uw abonnement of extra gebruikersplaatsen.
                </p>

                <h3 className="font-semibold text-[var(--navy-dark)] pt-2">Hulp nodig?</h3>
                <p>
                  Neem contact met ons op via{' '}
                  <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline">
                    contact@rijksuitgaven.nl
                  </a>{' '}
                  of bel{' '}
                  <a href="tel:0850806960" className="text-[var(--navy-medium)] hover:underline">
                    085-0806960
                  </a>
                  . Wij reageren doorgaans binnen &eacute;&eacute;n werkdag.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  )
}
