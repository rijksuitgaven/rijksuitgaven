/**
 * Shared constants for the application.
 * Centralizes labels and configurations used across multiple components.
 */

// Module display labels (Dutch)
export const MODULE_LABELS: Record<string, string> = {
  instrumenten: 'Instrumenten',
  apparaat: 'Apparaat',
  inkoop: 'Inkoop',
  publiek: 'Publiek',
  gemeente: 'Gemeente',
  provincie: 'Provincie',
  integraal: 'Integraal',
}

// All available modules
export const ALL_MODULES: string[] = [
  'instrumenten',
  'apparaat',
  'inkoop',
  'provincie',
  'gemeente',
  'publiek',
  'integraal',
]

// Type for module names (for stricter typing when needed)
export type ModuleName = 'instrumenten' | 'apparaat' | 'inkoop' | 'provincie' | 'gemeente' | 'publiek' | 'integraal'

// Field labels for detail views and Match column
export const FIELD_LABELS: Record<string, string> = {
  regeling: 'Regeling',
  artikel: 'Artikel',
  artikelonderdeel: 'Artikelonderdeel',
  begrotingsnaam: 'Begrotingsnaam',
  instrument: 'Instrument',
  detail: 'Detail',
  kostensoort: 'Kostensoort',
  ministerie: 'Ministerie',
  categorie: 'Categorie',
  staffel: 'Staffel',
  provincie: 'Provincie',
  gemeente: 'Gemeente',
  beleidsterrein: 'Beleidsterrein',
  omschrijving: 'Omschrijving',
  source: 'Organisatie',
  trefwoorden: 'Trefwoorden',
  sectoren: 'Sectoren',
  regio: 'Regio',
  onderdeel: 'Onderdeel',
}

// Available years in the data
export const AVAILABLE_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] as const
