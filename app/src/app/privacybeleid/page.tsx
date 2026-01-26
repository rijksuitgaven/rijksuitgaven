import Link from 'next/link'

export const metadata = {
  title: 'Privacybeleid - Rijksuitgaven.nl',
  description: 'Hoe Rijksuitgaven.nl omgaat met persoonsgegevens en cookies',
}

export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="text-[var(--navy-medium)] hover:text-[var(--navy-dark)] text-sm mb-4 inline-block">
            &larr; Terug naar home
          </Link>
          <h1 className="text-2xl font-bold text-[var(--navy-dark)]" style={{ fontFamily: 'var(--font-heading), serif' }}>
            Privacybeleid
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1 text-sm">
            Laatst bijgewerkt: 26 januari 2026
          </p>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* Artikel 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 1 - Algemeen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              1.1 Dit privacybeleid beschrijft hoe Rijksuitgaven.nl omgaat met persoonsgegevens van gebruikers die het platform bezoeken of zich abonneren op de diensten.
            </p>
            <p className="text-[var(--foreground)]">
              1.2 Rijksuitgaven.nl respecteert de privacy van alle gebruikers en draagt er zorg voor dat persoonlijke informatie vertrouwelijk wordt behandeld.
            </p>
          </section>

          {/* Artikel 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 2 - Verzameling van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              2.1 Rijksuitgaven.nl verzamelt persoonsgegevens die door de gebruiker actief worden verstrekt, zoals naam, e-mailadres, en organisatie wanneer de gebruiker een abonnement afsluit.
            </p>
            <p className="text-[var(--foreground)]">
              2.2 Daarnaast verzamelt Rijksuitgaven.nl automatisch gegevens bij het gebruik van het platform, zoals IP-adressen en apparaat-informatie om de functionaliteit en veiligheid van het platform te verbeteren.
            </p>
          </section>

          {/* Artikel 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 3 - Gebruik van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              3.1 Rijksuitgaven.nl gebruikt persoonsgegevens voor de volgende doeleinden:
            </p>
            <ul className="list-disc pl-6 text-[var(--foreground)] space-y-2 mb-3">
              <li>Het leveren van diensten die zijn overeengekomen in het kader van een abonnement.</li>
              <li>Het onderhouden van contact met de gebruiker, zoals klantenservice en ondersteuning.</li>
              <li>Het verbeteren van de functionaliteit en gebruikerservaring van het platform.</li>
              <li>Het verwerken van betalingen en administratie van abonnementen.</li>
              <li>Het voldoen aan wettelijke verplichtingen.</li>
            </ul>
          </section>

          {/* Artikel 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 4 - Delen van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              4.1 Rijksuitgaven.nl deelt persoonsgegevens niet met derden, tenzij dit noodzakelijk is voor de uitvoering van de overeenkomst, bijvoorbeeld bij betalingsverwerking, of om te voldoen aan wettelijke verplichtingen.
            </p>
            <p className="text-[var(--foreground)]">
              4.2 In gevallen waarin persoonsgegevens met derden worden gedeeld, zorgt Rijksuitgaven.nl voor passende maatregelen om de bescherming van de gegevens te waarborgen.
            </p>
          </section>

          {/* Artikel 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 5 - Beveiliging van persoonsgegevens
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              5.1 Rijksuitgaven.nl treft passende technische en organisatorische maatregelen om persoonsgegevens te beschermen tegen verlies of onrechtmatig gebruik.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              5.2 Persoonsgegevens worden opgeslagen in beveiligde omgevingen en de toegang hiertoe is beperkt tot bevoegde medewerkers die de gegevens nodig hebben voor de uitvoering van hun taken.
            </p>
            <p className="text-[var(--foreground)]">
              5.3 Transport van persoonsgegevens is beveiligd middels HTTPS.
            </p>
          </section>

          {/* Artikel 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 6 - Bewaartermijnen
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              6.1 Rijksuitgaven.nl bewaart persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor deze zijn verzameld, tenzij een langere bewaartermijn wettelijk verplicht is.
            </p>
            <p className="text-[var(--foreground)]">
              6.2 Gegevens met betrekking tot een abonnement worden bewaard zolang het abonnement actief is en daarna voor maximaal zeven jaar voor administratieve en wettelijke doeleinden.
            </p>
          </section>

          {/* Artikel 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 7 - Rechten van gebruikers
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              7.1 Gebruikers hebben het recht om hun persoonsgegevens in te zien, te corrigeren of te verwijderen. Een verzoek daartoe kan worden ingediend via de contactgegevens op de website.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              7.2 Gebruikers hebben het recht om bezwaar te maken tegen de verwerking van hun persoonsgegevens of om een beperking van de verwerking te vragen.
            </p>
            <p className="text-[var(--foreground)]">
              7.3 Gebruikers hebben het recht op gegevensoverdraagbaarheid. Dit betekent dat gebruikers een verzoek kunnen indienen om de persoonsgegevens die Rijksuitgaven.nl van hen heeft, in een gestructureerde, gangbare en machineleesbare vorm te ontvangen.
            </p>
          </section>

          {/* Artikel 8 - Cookies */}
          <section className="mb-10" id="artikel-8-cookies">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 8 - Cookies
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              8.1 Rijksuitgaven.nl maakt uitsluitend gebruik van noodzakelijke (essentiële) cookies die vereist zijn voor de basisfunctionaliteit van het platform.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.2 De volgende cookies worden gebruikt:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-[var(--border)]">
                <thead className="bg-[var(--gray-light)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">Cookie</th>
                    <th className="px-4 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">Doel</th>
                    <th className="px-4 py-2 text-left font-semibold text-[var(--navy-dark)] border-b border-[var(--border)]">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Sessie cookie</td>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Inlogstatus behouden</td>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Sessie (tot uitloggen)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Lokale opslag</td>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Gebruikersvoorkeuren</td>
                    <td className="px-4 py-2 border-b border-[var(--border)]">Permanent</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[var(--foreground)] mb-3">
              8.3 Voor essentiële cookies is geen toestemming vereist onder de AVG en de Telecommunicatiewet, aangezien deze strikt noodzakelijk zijn voor het functioneren van de dienst.
            </p>
            <p className="text-[var(--foreground)] mb-3">
              8.4 Rijksuitgaven.nl maakt geen gebruik van tracking cookies, analytische cookies of marketing cookies.
            </p>
            <p className="text-[var(--foreground)]">
              8.5 Gebruikers kunnen cookies beheren of verwijderen via de instellingen van hun browser. Het blokkeren van essentiële cookies kan ertoe leiden dat bepaalde functies niet correct werken.
            </p>
          </section>

          {/* Artikel 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 9 - Wijzigingen in het privacybeleid
            </h2>
            <p className="text-[var(--foreground)]">
              9.1 Rijksuitgaven.nl behoudt zich het recht voor om dit privacybeleid te wijzigen. Wijzigingen zullen op de website worden gepubliceerd. Het is aan te raden dit beleid regelmatig te raadplegen.
            </p>
          </section>

          {/* Artikel 10 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[var(--navy-dark)] mb-4" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Artikel 10 - Contact
            </h2>
            <p className="text-[var(--foreground)] mb-3">
              10.1 Voor vragen over dit privacybeleid of de verwerking van persoonsgegevens kan de gebruiker contact opnemen met Rijksuitgaven.nl via:
            </p>
            <p className="text-[var(--foreground)] font-medium">
              E-mail:{' '}
              <a href="mailto:contact@rijksuitgaven.nl" className="text-[var(--navy-medium)] hover:underline">
                contact@rijksuitgaven.nl
              </a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-8 mt-12">
        <div className="max-w-4xl mx-auto text-center text-sm text-[var(--muted-foreground)]">
          <p>&copy; {new Date().getFullYear()} Rijksuitgaven.nl</p>
        </div>
      </footer>
    </div>
  )
}
