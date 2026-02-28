/**
 * Release notes for the in-app banner.
 *
 * When deploying a user-facing feature, add a new entry here AND
 * update /versiegeschiedenis/page.tsx with the detailed version.
 *
 * The banner shows short titles + summaries.
 * The versiegeschiedenis page shows full descriptions.
 *
 * Array is sorted newest-first.
 */

export interface ReleaseNote {
  /** ISO date: '2026-02-24' */
  date: string
  /** Version label: 'V2.0.2' */
  version: string
  /** Short, benefit-first title (Dutch, formal u/uw) */
  title: string
  /** One sentence explaining the improvement */
  summary: string
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    date: '2026-02-27',
    version: 'V2.3',
    title: 'Nauwkeurigere zoekresultaten',
    summary: 'Bedragen bij zoekresultaten tonen nu alleen de relevante betalingen.',
  },
  {
    date: '2026-02-24',
    version: 'V2.2',
    title: 'Sorteer direct op de hoogste bedragen',
    summary: 'Eerste klik sorteert nu van hoog naar laag.',
  },
  {
    date: '2026-02-21',
    version: 'V2.1',
    title: 'Slimmer zoeken met meerdere woorden',
    summary: 'Zoek met meerdere woorden, exacte zinnen en wildcards.',
  },
  {
    date: '2026-02-20',
    version: 'V2.0',
    title: 'Rijksuitgaven.nl volledig opnieuw gebouwd',
    summary: 'Sneller zoeken, meer data en nieuwe functies.',
  },
]
