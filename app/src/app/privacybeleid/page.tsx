import Link from 'next/link'
import { TrackPageView } from '@/components/analytics/track-page-view'

export const metadata = {
  title: 'Privacybeleid - Rijksuitgaven.nl',
  description: 'Hoe Rijksuitgaven.nl omgaat met persoonsgegevens en cookies',
}

const thStyle = 'px-4 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]'
const tdStyle = 'px-4 py-2 border-b border-[var(--border)]'

export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-white">
      <TrackPageView page="privacybeleid" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
            Privacybeleid
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Laatst bijgewerkt: 18 februari 2026
          </p>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* Artikel 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 1 – Algemeen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              1.1 Dit privacybeleid beschrijft hoe Rijksuitgaven.nl omgaat met persoonsgegevens van bezoekers en abonnees van het platform.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              1.2 Rijksuitgaven.nl is een dienst van <strong>Het Maven Collectief</strong> (KvK-nummer: 96257008). Het Maven Collectief is de verwerkingsverantwoordelijke in de zin van de Algemene Verordening Gegevensbescherming (AVG).
            </p>
            <p className="text-[var(--foreground)]">
              1.3 Rijksuitgaven.nl respecteert de privacy van alle gebruikers en draagt er zorg voor dat persoonsgegevens vertrouwelijk en conform de toepasselijke wet- en regelgeving worden verwerkt.
            </p>
          </section>

          {/* Artikel 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 2 – Verzameling van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              2.1 Rijksuitgaven.nl verwerkt persoonsgegevens die u actief verstrekt of die door een abonnementsbeheerder worden aangeleverd:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li><strong>E-mailadres:</strong> Vereist voor authenticatie via inloglinks en transactionele berichten.</li>
              <li><strong>Naam:</strong> Voor identificatie binnen het platform.</li>
              <li><strong>Organisatie:</strong> Om aan te geven bij welke organisatie u werkzaam bent.</li>
              <li><strong>Abonnementsgegevens:</strong> Type abonnement, startdatum, einddatum en status.</li>
              <li><strong>Gebruikersrol:</strong> Of u lid of beheerder bent van de organisatielicentie.</li>
            </ul>
            <p className="text-[var(--foreground)] mb-3">
              2.2 Via het contactformulier op de website worden naam, e-mailadres, organisatie en uw bericht verwerkt ten behoeve van beantwoording van uw vraag.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              2.3 Via de feedbackfunctie in het platform worden door u ingevoerde tekst en optionele schermafdrukken verwerkt ten behoeve van productverbetering.
            </p>
            <p className="text-[var(--foreground)]">
              2.4 Rijksuitgaven.nl slaat geen wachtwoorden op. Authenticatie verloopt uitsluitend via tijdelijke inloglinks die per e-mail worden verstuurd.
            </p>
          </section>

          {/* Artikel 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 3 – Gebruik van persoonsgegevens en rechtsgrondslagen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              3.1 Rijksuitgaven.nl verwerkt persoonsgegevens uitsluitend voor de volgende doeleinden:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li><strong>Uitvoering van de overeenkomst (AVG artikel 6(1)(b)):</strong> Het verlenen van toegang tot het platform, authenticatie, beheer van abonnementen en gebruikersaccounts, en het verzenden van inloglinks en systeemberichten.</li>
              <li><strong>Wettelijke verplichtingen (AVG artikel 6(1)(c)):</strong> Het bewaren van administratieve en financiële gegevens conform fiscale wetgeving.</li>
              <li><strong>Gerechtvaardigd belang (AVG artikel 6(1)(f)):</strong> Gepseudonimiseerde logging van platformgebruik voor servicekwaliteit en misbruikpreventie (zie artikel 5), beantwoording van contactverzoeken en feedback, en het meten van bezorg-, open- en klikpercentages van e-mailcampagnes ter verbetering van onze communicatie.</li>
            </ul>
            <p className="text-[var(--foreground)]">
              3.2 Rijksuitgaven.nl verwerkt geen bijzondere categorieën persoonsgegevens.
            </p>
          </section>

          {/* Artikel 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 4 – Derden en verwerkers
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              4.1 Rijksuitgaven.nl schakelt uitsluitend verwerkers in die strikt noodzakelijk zijn voor de levering van de dienst. Met alle verwerkers zijn verwerkersovereenkomsten gesloten die voldoen aan de AVG.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              4.2 De volgende categorieën verwerkers worden ingeschakeld:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-[var(--border)]">
                <thead className="bg-[var(--gray-light)]">
                  <tr>
                    <th className={thStyle}>Categorie</th>
                    <th className={thStyle}>Doel</th>
                    <th className={thStyle}>Locatie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdStyle}>Database- en authenticatie-infrastructuur</td>
                    <td className={tdStyle}>Opslag van accountgegevens, sessie-authenticatie</td>
                    <td className={tdStyle}>Europese Unie</td>
                  </tr>
                  <tr>
                    <td className={tdStyle}>Hostinginfrastructuur</td>
                    <td className={tdStyle}>Hosting van de webapplicatie en zoekinfrastructuur</td>
                    <td className={tdStyle}>Europese Unie</td>
                  </tr>
                  <tr>
                    <td className={tdStyle}>E-mailverzending</td>
                    <td className={tdStyle}>Verzending van inloglinks, uitnodigingen en systeemberichten</td>
                    <td className={tdStyle}>Europese Unie</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[var(--foreground)] mb-3">
              4.3 Alle verwerking vindt plaats binnen de Europese Economische Ruimte (EER). Er worden geen persoonsgegevens overgedragen aan landen buiten de EER.
            </p>
            <p className="text-[var(--foreground)]">
              4.4 Rijksuitgaven.nl deelt geen persoonsgegevens met derden voor marketing- of commerciële doeleinden.
            </p>
          </section>

          {/* Artikel 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 5 – Gepseudonimiseerde gebruiksanalyse
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              5.1 Rijksuitgaven.nl registreert op de server hoe het platform wordt gebruikt. Dit gebeurt uitsluitend server-side; er worden geen analytische cookies of client-side trackingscripts gebruikt.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              5.2 Bij elke registratie wordt het gebruikers-ID direct omgezet in een niet-herleidbaar pseudoniem. Er worden geen e-mailadressen, namen of andere directe persoonsgegevens opgeslagen in de gebruiksregistratie.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              5.3 De vastgelegde gegevens omvatten het pseudoniem, het type actie (zoals het bekijken van een module of het uitvoeren van een zoekopdracht), het tijdstip en het betreffende onderdeel van het platform.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              5.4 Deze gegevens worden uitsluitend gebruikt voor verbetering van de dienst en voor de detectie van misbruik. Bewaarperiode: 90 dagen.
            </p>
            <p className="text-[var(--foreground)]">
              5.5 Rechtsgrondslag: gerechtvaardigd belang (AVG artikel 6(1)(f)). Het belang van Rijksuitgaven.nl bij serviceverbetering weegt op tegen de privacybelangen van gebruikers, aangezien geen directe persoonsgegevens worden bewaard en heridentificatie in de praktijk niet mogelijk is.
            </p>
          </section>

          {/* Artikel 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 6 – Beveiliging van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              6.1 Rijksuitgaven.nl treft passende technische en organisatorische maatregelen om persoonsgegevens te beschermen:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li>Alle communicatie verloopt via HTTPS met TLS-versleuteling.</li>
              <li>Persoonsgegevens worden versleuteld opgeslagen.</li>
              <li>Databasetoegang is beperkt via roltoegangscontrole; gebruikers kunnen uitsluitend hun eigen gegevens inzien.</li>
              <li>Alle gebruikersinvoer wordt gevalideerd ter voorkoming van injecties.</li>
              <li>Toegang tot productiegegevens is beperkt tot technisch noodzakelijke handelingen.</li>
            </ul>
            <p className="text-[var(--foreground)]">
              6.2 Persoonsgegevens worden opgeslagen in beveiligde cloudomgevingen binnen de EU.
            </p>
          </section>

          {/* Artikel 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 7 – Bewaartermijnen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              7.1 Rijksuitgaven.nl bewaart persoonsgegevens niet langer dan noodzakelijk:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li><strong>Actieve abonnementen:</strong> Bewaard voor de duur van het abonnement.</li>
              <li><strong>Verlopen of opgezegde abonnementen:</strong> Bewaard totdat u verzoekt om verwijdering, of totdat de wettelijke bewaartermijn verloopt.</li>
              <li><strong>Fiscale administratie:</strong> Minimaal zeven jaar na beëindiging van het abonnement (wettelijke verplichting).</li>
              <li><strong>Inlogsessies:</strong> Sessieverificatietokens maximaal 30 dagen, of tot uitloggen.</li>
              <li><strong>Gebruiksanalyse (gepseudonimiseerd):</strong> 90 dagen.</li>
              <li><strong>Contactformulier en feedback:</strong> Maximaal twee jaar na laatste contact, tenzij eerder verwijdering wordt verzocht.</li>
            </ul>
            <p className="text-[var(--foreground)]">
              7.2 Op uw verzoek worden persoonsgegevens binnen 30 dagen verwijderd, tenzij een wettelijke bewaarverplichting van toepassing is.
            </p>
          </section>

          {/* Artikel 8 */}
          <section className="mb-10" id="cookies">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 8 – Cookies en lokale opslag
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              8.1 Rijksuitgaven.nl maakt uitsluitend gebruik van <strong>essentiële (functionele) cookies en lokale browseropslag</strong> die strikt noodzakelijk zijn voor de werking van het platform. Er worden geen analytische, tracking- of marketingcookies gebruikt.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.2 De volgende cookies en lokale opslag worden gebruikt:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-[var(--border)]">
                <thead className="bg-[var(--gray-light)]">
                  <tr>
                    <th className={thStyle}>Type</th>
                    <th className={thStyle}>Naam</th>
                    <th className={thStyle}>Doel</th>
                    <th className={thStyle}>Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdStyle}>Cookie</td>
                    <td className={`${tdStyle} font-mono text-xs`}>sb-*-auth-token</td>
                    <td className={tdStyle}>Authenticatie: bewaart de inlogstatus</td>
                    <td className={tdStyle}>Max. 30 dagen of tot uitloggen</td>
                  </tr>
                  <tr>
                    <td className={tdStyle}>Lokale opslag</td>
                    <td className={`${tdStyle} font-mono text-xs`}>cookie-banner-dismissed</td>
                    <td className={tdStyle}>Onthoudt dat de cookiemelding is gesloten</td>
                    <td className={tdStyle}>Permanent</td>
                  </tr>
                  <tr>
                    <td className={tdStyle}>Lokale opslag</td>
                    <td className={tdStyle}>Gebruikersvoorkeuren</td>
                    <td className={tdStyle}>Tabelinstellingen zoals kolomweergave</td>
                    <td className={tdStyle}>Permanent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[var(--foreground)] mb-3">
              8.3 De authenticatiecookie is beveiligd met de kenmerken httpOnly, Secure en SameSite, waardoor deze niet toegankelijk is via browserscripts en uitsluitend via HTTPS wordt verstuurd.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.4 Voor essentiële cookies is geen voorafgaande toestemming vereist op grond van artikel 11.7a Telecommunicatiewet, aangezien deze strikt noodzakelijk zijn voor de door u gevraagde dienst. Lokale opslag valt onder hetzelfde wettelijke kader.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.5 Rijksuitgaven.nl maakt geen gebruik van Google Analytics, marketingcookies, advertentiecookies, social media tracking pixels of externe trackingscripts. Het platform gebruikt zelfgehoste lettertypen; er worden geen externe verzoeken gedaan naar diensten zoals Google Fonts.
            </p>
            <p className="text-[var(--foreground)]">
              8.6 U kunt cookies verwijderen via de instellingen van uw browser. Het verwijderen van de authenticatiecookie heeft als gevolg dat u wordt uitgelogd.
            </p>
          </section>

          {/* Artikel 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 9 – Rechten van betrokkenen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              9.1 Op grond van de AVG heeft u de volgende rechten:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li><strong>Inzage (artikel 15 AVG):</strong> U kunt opvragen welke persoonsgegevens wij van u verwerken.</li>
              <li><strong>Rectificatie (artikel 16 AVG):</strong> U kunt verzoeken om correctie van onjuiste of onvolledige gegevens.</li>
              <li><strong>Verwijdering (artikel 17 AVG):</strong> U kunt verzoeken om verwijdering van uw persoonsgegevens.</li>
              <li><strong>Beperking van verwerking (artikel 18 AVG):</strong> U kunt verzoeken om beperking van de verwerking.</li>
              <li><strong>Bezwaar (artikel 21 AVG):</strong> U kunt bezwaar maken tegen verwerking op grond van gerechtvaardigd belang.</li>
              <li><strong>Gegevensoverdraagbaarheid (artikel 20 AVG):</strong> U kunt uw gegevens ontvangen in een gestructureerd, gangbaar en machineleesbaar formaat.</li>
            </ul>
            <p className="text-[var(--foreground)] mb-3">
              9.2 U kunt uw rechten uitoefenen door een e-mail te sturen naar{' '}
              <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline">
                contact@rijksuitgaven.nl
              </a>. Wij reageren binnen 30 dagen op uw verzoek.
            </p>
            <p className="text-[var(--foreground)]">
              9.3 Indien u van mening bent dat uw persoonsgegevens niet correct worden verwerkt, heeft u het recht een klacht in te dienen bij de{' '}
              <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-[var(--navy-medium)] hover:underline">
                Autoriteit Persoonsgegevens
              </a>.
            </p>
          </section>

          {/* Artikel 10 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 10 – Wijzigingen
            </h2>
            <p className="text-[var(--foreground)]">
              10.1 Rijksuitgaven.nl behoudt zich het recht voor dit privacybeleid te wijzigen. De meest actuele versie is te raadplegen op rijksuitgaven.nl/privacybeleid. Bij materiële wijzigingen worden actieve abonnees via e-mail geïnformeerd.
            </p>
          </section>

          {/* Artikel 11 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), sans-serif' }}>
              Artikel 11 – Contact
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              11.1 Voor vragen over dit privacybeleid of de verwerking van uw persoonsgegevens kunt u contact opnemen via:
            </p>
            <div className="text-[var(--foreground)]">
              <p className="font-semibold">Het Maven Collectief</p>
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
