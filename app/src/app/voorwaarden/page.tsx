import Link from 'next/link'
import { TrackPageView } from '@/components/analytics/track-page-view'

export const metadata = {
  title: 'Algemene Voorwaarden - Rijksuitgaven.nl',
  description: 'Algemene voorwaarden voor het gebruik van Rijksuitgaven.nl',
}

const thStyle = 'px-4 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]'
const tdStyle = 'px-4 py-2 border-b border-[var(--border)]'

export default function VoorwaardenPage() {
  return (
    <div className="min-h-screen bg-white">
      <TrackPageView page="voorwaarden" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Algemene Voorwaarden
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Laatst bijgewerkt: 18 februari 2026
          </p>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* Artikel 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 1 – Definities
            </h2>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-[var(--border)]">
                <thead className="bg-[var(--gray-light)]">
                  <tr>
                    <th className={thStyle}>Term</th>
                    <th className={thStyle}>Betekenis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Dienstverlener</td>
                    <td className={tdStyle}>Rijksuitgaven.nl, geregistreerd bij de Kamer van Koophandel onder nummer 96257008.</td>
                  </tr>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Platform</td>
                    <td className={tdStyle}>De webapplicatie Rijksuitgaven.nl, beschikbaar via rijksuitgaven.nl, inclusief alle functionaliteiten en gegevens.</td>
                  </tr>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Abonnement</td>
                    <td className={tdStyle}>De overeenkomst tussen de Afnemer en de Dienstverlener op basis van een maand- of jaarabonnement.</td>
                  </tr>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Afnemer</td>
                    <td className={tdStyle}>De rechtspersoon of organisatie die een Abonnement afsluit.</td>
                  </tr>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Gebruiker</td>
                    <td className={tdStyle}>De natuurlijke persoon die via een persoonlijke inloglink toegang heeft tot het Platform namens de Afnemer.</td>
                  </tr>
                  <tr>
                    <td className={`${tdStyle} font-semibold`}>Inloglink</td>
                    <td className={tdStyle}>De per e-mail verstuurde tijdelijke, unieke link waarmee een Gebruiker zich aanmeldt bij het Platform.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Artikel 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 2 – Toepasselijkheid
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              2.1 Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, abonnementen en diensten van de Dienstverlener met betrekking tot het Platform.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              2.2 Het Platform richt zich uitsluitend op zakelijke afnemers (business-to-business). Door het afsluiten van een Abonnement verklaart de Afnemer te handelen in de uitoefening van beroep of bedrijf.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              2.3 Afwijkingen van deze voorwaarden zijn uitsluitend geldig indien schriftelijk overeengekomen.
            </p>
            <p className="text-[var(--foreground)]">
              2.4 Eventuele inkoop- of andere voorwaarden van de Afnemer zijn niet van toepassing.
            </p>
          </section>

          {/* Artikel 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 3 – Abonnementen en toegang
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              3.1 De Dienstverlener biedt maand- en jaarabonnementen aan. De Afnemer heeft toegang tot het Platform zolang het Abonnement actief is en de verschuldigde betalingen zijn voldaan.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              3.2 Elk Abonnement omvat een of meer persoonlijke Gebruikersplaatsen. Elke Gebruiker ontvangt een eigen e-mailadres gekoppelde Inloglink. Inloglinks zijn strikt persoonlijk en mogen niet worden gedeeld met derden.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              3.3 Het Platform maakt geen gebruik van wachtwoorden. Authenticatie verloopt uitsluitend via tijdelijke Inloglinks die per e-mail worden verstuurd.
            </p>
            <p className="text-[var(--foreground)]">
              3.4 Bij constatering van het delen van Inloglinks of ongeautoriseerd gebruik behoudt de Dienstverlener zich het recht voor om de toegang tot het Platform per direct te beëindigen, onverminderd het recht op volledige betaling van het lopende Abonnement.
            </p>
          </section>

          {/* Artikel 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 4 – Gebruiksregels
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              4.1 Het is de Afnemer en Gebruiker niet toegestaan om gegevens verkregen via het Platform systematisch te kopiëren, verveelvoudigen, openbaar te maken of aan derden ter beschikking te stellen, anders dan voor eigen intern gebruik binnen de kaders van het Abonnement.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              4.2 Scraping, data-mining, crawling of enig ander geautomatiseerd proces om toegang te verkrijgen tot gegevens van het Platform is strikt verboden, tenzij hiervoor voorafgaande schriftelijke toestemming is verkregen.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              4.3 Het Platform biedt een exportfunctie waarmee maximaal 500 rijen per export kunnen worden gedownload. Deze limiet is onderdeel van de dienst en mag niet worden omzeild.
            </p>
            <p className="text-[var(--foreground)]">
              4.4 Overtreding van dit artikel kan leiden tot onmiddellijke beëindiging van het Abonnement zonder recht op restitutie, onverminderd het recht van de Dienstverlener op schadevergoeding.
            </p>
          </section>

          {/* Artikel 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 5 – Gegevens en databankrecht
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              5.1 De brongegevens die via het Platform worden ontsloten zijn afkomstig van officiële openbare overheidsbronnen en zijn als zodanig geen eigendom van de Dienstverlener.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              5.2 De Dienstverlener heeft aanzienlijke investeringen gedaan in de verzameling, verwerking, structurering, normalisatie en doorzoekbaar maken van deze gegevens. Op de aldus samengestelde databank rust een sui-generis databankrecht in de zin van de Databankenwet.
            </p>
            <p className="text-[var(--foreground)]">
              5.3 Het opvragen of hergebruiken van een substantieel deel van de inhoud van de databank is niet toegestaan zonder voorafgaande schriftelijke toestemming van de Dienstverlener.
            </p>
          </section>

          {/* Artikel 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 6 – Betaling
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              6.1 De Dienstverlener factureert de Abonnementsgelden vooraf. Facturen worden verstuurd door Rijksuitgaven.nl.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              6.2 Betaling dient te geschieden binnen 14 dagen na factuurdatum, tenzij schriftelijk anders is overeengekomen.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              6.3 Bij niet-tijdige betaling is de Afnemer van rechtswege in verzuim. De Dienstverlener is gerechtigd de toegang tot het Platform op te schorten totdat de openstaande betaling is voldaan.
            </p>
            <p className="text-[var(--foreground)]">
              6.4 Alle genoemde prijzen zijn exclusief btw, tenzij uitdrukkelijk anders vermeld.
            </p>
          </section>

          {/* Artikel 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 7 – Duur en opzegging
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              7.1 Maandabonnementen worden aangegaan voor onbepaalde tijd en kunnen op elk moment worden opgezegd. De opzegging treedt in werking aan het einde van de lopende maandperiode.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              7.2 Jaarabonnementen worden aangegaan voor een periode van twaalf maanden. Opzegging is op elk moment mogelijk. Bij tussentijdse opzegging van een jaarabonnement wordt het resterende bedrag naar rato gerestitueerd op basis van het aantal volle resterende maanden.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              7.3 Jaarabonnementen worden niet automatisch verlengd. De Dienstverlener informeert de Afnemer tijdig over het naderende einde van het Abonnement.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              7.4 Na beëindiging van het Abonnement wordt de toegang tot het Platform onmiddellijk beëindigd. Het Platform slaat geen gebruikersinhoud op; er is derhalve geen exportperiode van toepassing.
            </p>
            <p className="text-[var(--foreground)]">
              7.5 Opzegging geschiedt per e-mail aan{' '}
              <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline">
                contact@rijksuitgaven.nl
              </a>.
            </p>
          </section>

          {/* Artikel 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 8 – Beschikbaarheid
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              8.1 De Dienstverlener streeft naar een hoge beschikbaarheid van het Platform, maar garandeert geen ononderbroken toegang.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.2 De Dienstverlener is gerechtigd het Platform tijdelijk buiten gebruik te stellen ten behoeve van onderhoud, aanpassingen of verbeteringen. De Dienstverlener streeft ernaar dergelijke onderbrekingen buiten kantooruren te laten plaatsvinden.
            </p>
            <p className="text-[var(--foreground)]">
              8.3 Onderbrekingen in de beschikbaarheid geven geen recht op schadevergoeding of restitutie.
            </p>
          </section>

          {/* Artikel 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 9 – Aansprakelijkheid en disclaimer
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              9.1 De gegevens op het Platform zijn afkomstig van openbare overheidsbronnen en worden gepresenteerd zoals door de bron verstrekt. De Dienstverlener geeft geen garantie met betrekking tot de juistheid, volledigheid of actualiteit van de weergegeven gegevens.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              9.2 De Afnemer is zelf verantwoordelijk voor de interpretatie en het gebruik van de via het Platform verkregen gegevens. Het Platform is een hulpmiddel voor onderzoek en vervangt geen eigen controle of professioneel advies.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              9.3 De Dienstverlener is niet aansprakelijk voor enige directe of indirecte schade, waaronder maar niet beperkt tot gederfde winst, gevolgschade of schade als gevolg van onjuiste gegevens, tenzij sprake is van opzet of bewuste roekeloosheid aan de zijde van de Dienstverlener.
            </p>
            <p className="text-[var(--foreground)]">
              9.4 Indien de Dienstverlener ondanks het bepaalde in dit artikel aansprakelijk mocht zijn, is de totale aansprakelijkheid beperkt tot het bedrag dat de Afnemer in de twaalf maanden voorafgaand aan de schadeveroorzakende gebeurtenis aan Abonnementsgelden heeft betaald.
            </p>
          </section>

          {/* Artikel 10 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 10 – Intellectuele eigendomsrechten
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              10.1 Alle intellectuele eigendomsrechten op het Platform, waaronder de software, het ontwerp, de gebruikersinterface en de documentatie, berusten bij de Dienstverlener.
            </p>
            <p className="text-[var(--foreground)]">
              10.2 Het Abonnement verleent de Afnemer een niet-exclusief, niet-overdraagbaar gebruiksrecht op het Platform voor de duur van het Abonnement, uitsluitend voor intern gebruik conform deze voorwaarden.
            </p>
          </section>

          {/* Artikel 11 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 11 – Beveiliging
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              11.1 De Dienstverlener treft passende technische en organisatorische maatregelen om het Platform en de gegevens van Gebruikers te beschermen tegen verlies of onrechtmatig gebruik.
            </p>
            <p className="text-[var(--foreground)]">
              11.2 De Gebruiker is verantwoordelijk voor de beveiliging van de eigen e-mailaccount waarnaar Inloglinks worden verstuurd.
            </p>
          </section>

          {/* Artikel 12 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 12 – Privacy
            </h2>
            <p className="text-[var(--foreground)]">
              12.1 De Dienstverlener verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG). Het privacybeleid is te raadplegen op{' '}
              <Link href="/privacybeleid" className="text-[var(--navy-medium)] hover:underline">
                rijksuitgaven.nl/privacybeleid
              </Link>.
            </p>
          </section>

          {/* Artikel 13 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 13 – Overmacht
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              13.1 De Dienstverlener is niet aansprakelijk voor enige tekortkoming in de nakoming van zijn verplichtingen indien deze het gevolg is van overmacht, waaronder begrepen maar niet beperkt tot storingen in telecommunicatienetwerken, stroomuitval, overheidsmaatregelen, pandemieën of storingen bij toeleveranciers.
            </p>
            <p className="text-[var(--foreground)]">
              13.2 Indien de overmacht langer dan 60 dagen voortduurt, zijn beide partijen gerechtigd het Abonnement te ontbinden. In dat geval wordt het vooruitbetaalde bedrag naar rato gerestitueerd.
            </p>
          </section>

          {/* Artikel 14 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 14 – Wijzigingen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              14.1 De Dienstverlener behoudt zich het recht voor deze voorwaarden te wijzigen. Gewijzigde voorwaarden worden ten minste 30 dagen voor inwerkingtreding aan de Afnemer medegedeeld.
            </p>
            <p className="text-[var(--foreground)]">
              14.2 Indien de Afnemer niet akkoord gaat met de gewijzigde voorwaarden, kan de Afnemer het Abonnement opzeggen voor de datum van inwerkingtreding.
            </p>
          </section>

          {/* Artikel 15 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 15 – Overdracht
            </h2>
            <p className="text-[var(--foreground)]">
              15.1 De Dienstverlener is gerechtigd rechten en verplichtingen uit het Abonnement over te dragen aan een derde, mits de Afnemer hiervan schriftelijk op de hoogte wordt gesteld. De Afnemer kan het Abonnement niet overdragen zonder voorafgaande schriftelijke toestemming van de Dienstverlener.
            </p>
          </section>

          {/* Artikel 16 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 16 – Toepasselijk recht en geschillen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              16.1 Op deze voorwaarden en alle overeenkomsten tussen de Dienstverlener en de Afnemer is uitsluitend Nederlands recht van toepassing.
            </p>
            <p className="text-[var(--foreground)]">
              16.2 Geschillen die voortvloeien uit of verband houden met deze voorwaarden worden voorgelegd aan de bevoegde rechter te Amsterdam.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Contact
            </h2>
            <div className="text-[var(--foreground)]">
              <p className="font-semibold">Rijksuitgaven.nl</p>
              <p>KvK-nummer: 96257008</p>
              <p>
                E-mail:{' '}
                <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline">
                  contact@rijksuitgaven.nl
                </a>
              </p>
            </div>
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
