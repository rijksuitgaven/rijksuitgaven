/**
 * Build-time data generator for De Geldstroom Sankey visualization.
 *
 * Queries Supabase (PostgreSQL) for 6 data stories × all years (2016-2024).
 * Outputs: src/data/geldstroom.json (~18KB)
 *
 * Run: node scripts/generate-geldstroom-data.mjs
 * Requires: DATABASE_URL environment variable
 *
 * Design doc: docs/plans/2026-02-14-de-geldstroom-design.md
 */

import pg from 'pg'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'geldstroom.json')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9åäöüéèêëïîôùûçñ]+/gi, '-')
    .replace(/^-|-$/g, '')
}

function formatEuros(euros) {
  if (euros >= 1_000_000_000) return `€${(euros / 1_000_000_000).toFixed(1)} mld`
  if (euros >= 1_000_000) return `€${(euros / 1_000_000).toFixed(0)} mln`
  return `€${(euros / 1000).toFixed(0)}K`
}

/**
 * Build a story JSON structure from raw flow rows.
 *
 * @param {string} label - Display label for the story tab
 * @param {Array<{left_id: string, right_id: string, year: number, amount: number}>} rows
 * @param {string|null} overigeLabelLeft - Label for "Overige" on left (null if none)
 * @param {string} overigeLabelRight - Label for "Overige" on right
 */
function buildStoryFromFlows(label, rows, overigeLabelLeft, overigeLabelRight) {
  const leftAmounts = {}   // left_id -> { year: amount }
  const rightAmounts = {}  // right_id -> { year: amount }
  const flowAmounts = {}   // "left→right" -> { source, target, amounts: { year: amount } }
  const allYears = new Set()

  for (const row of rows) {
    const year = Number(row.year)
    const amount = Number(row.amount)
    if (!amount || isNaN(amount)) continue
    allYears.add(year)

    // Left node
    if (!leftAmounts[row.left_id]) leftAmounts[row.left_id] = {}
    leftAmounts[row.left_id][year] = (leftAmounts[row.left_id][year] || 0) + amount

    // Right node
    if (!rightAmounts[row.right_id]) rightAmounts[row.right_id] = {}
    rightAmounts[row.right_id][year] = (rightAmounts[row.right_id][year] || 0) + amount

    // Flow
    const key = `${row.left_id}→${row.right_id}`
    if (!flowAmounts[key]) flowAmounts[key] = { source: row.left_id, target: row.right_id, amounts: {} }
    flowAmounts[key].amounts[year] = (flowAmounts[key].amounts[year] || 0) + amount
  }

  const years = Array.from(allYears).sort((a, b) => a - b)
  const maxYear = Math.max(...years)

  // Sort left nodes: by maxYear amount descending, Overige always last
  const leftEntries = Object.entries(leftAmounts)
  leftEntries.sort((a, b) => {
    if (a[0] === overigeLabelLeft) return 1
    if (b[0] === overigeLabelLeft) return -1
    return (b[1][maxYear] || 0) - (a[1][maxYear] || 0)
  })

  const leftNodes = leftEntries.map(([nodeLabel, amounts]) => ({
    id: slugify(nodeLabel),
    label: nodeLabel,
    amounts,
  }))

  // Sort right nodes: by maxYear amount descending, Overige always last
  const rightEntries = Object.entries(rightAmounts)
  rightEntries.sort((a, b) => {
    if (a[0] === overigeLabelRight) return 1
    if (b[0] === overigeLabelRight) return -1
    return (b[1][maxYear] || 0) - (a[1][maxYear] || 0)
  })

  const rightNodes = rightEntries.map(([nodeLabel, amounts]) => ({
    id: slugify(nodeLabel),
    label: nodeLabel,
    amounts,
  }))

  // Build flows with slugified IDs
  const flows = Object.values(flowAmounts).map((f) => ({
    source: slugify(f.source),
    target: slugify(f.target),
    amounts: f.amounts,
  }))

  // Year totals
  const yearTotals = {}
  for (const year of years) {
    yearTotals[year] = leftNodes.reduce((sum, n) => sum + (n.amounts[year] || 0), 0)
  }

  return { label, years, leftNodes, rightNodes, flows, yearTotals }
}

// ---------------------------------------------------------------------------
// Valid year range — filter out dirty data (years 0, 1900, etc.)
// ---------------------------------------------------------------------------

const YEAR_MIN = 2018
const YEAR_MAX = 2024

// ---------------------------------------------------------------------------
// Story generators
// ---------------------------------------------------------------------------

async function generateInstrumenten(client) {
  console.log('  → Instrumenten...')
  const { rows } = await client.query(`
    WITH top_left AS (
      SELECT begrotingsnaam FROM instrumenten
      WHERE begrotingsjaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY begrotingsnaam
      ORDER BY SUM(bedrag::bigint * 1000) DESC
      LIMIT 6
    ),
    top_right AS (
      SELECT ontvanger FROM instrumenten
      WHERE begrotingsjaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY ontvanger
      ORDER BY SUM(bedrag::bigint * 1000) DESC
      LIMIT 5
    )
    SELECT
      CASE WHEN i.begrotingsnaam IN (SELECT begrotingsnaam FROM top_left)
           THEN i.begrotingsnaam ELSE 'Overige begrotingen' END AS left_id,
      CASE WHEN i.ontvanger IN (SELECT ontvanger FROM top_right)
           THEN i.ontvanger ELSE 'Overige ontvangers' END AS right_id,
      i.begrotingsjaar AS year,
      SUM(i.bedrag::bigint * 1000) AS amount
    FROM instrumenten i
    WHERE i.begrotingsjaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
    GROUP BY left_id, right_id, year
  `)
  return buildStoryFromFlows('Rijksbegroting', rows, 'Overige begrotingen', 'Overige ontvangers')
}

async function generatePubliek(client) {
  console.log('  → Publiek...')
  const { rows } = await client.query(`
    WITH top_right AS (
      SELECT ontvanger FROM publiek
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY ontvanger
      ORDER BY SUM(bedrag) DESC
      LIMIT 5
    )
    SELECT
      p.source AS left_id,
      CASE WHEN p.ontvanger IN (SELECT ontvanger FROM top_right)
           THEN p.ontvanger ELSE 'Overige ontvangers' END AS right_id,
      p.jaar AS year,
      SUM(p.bedrag) AS amount
    FROM publiek p
    WHERE p.jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
    GROUP BY left_id, right_id, year
  `)
  return buildStoryFromFlows('Publieke organisaties', rows, null, 'Overige ontvangers')
}

async function generateInkoop(client) {
  console.log('  → Inkoop...')
  const { rows } = await client.query(`
    WITH normalized AS (
      SELECT
        CASE
          WHEN ministerie IN ('I & W', 'I & M') THEN 'I&W'
          WHEN ministerie = 'J & V' THEN 'J&V'
          ELSE ministerie
        END AS norm_ministerie,
        leverancier, jaar, totaal_avg
      FROM inkoop
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
    ),
    top_left AS (
      SELECT norm_ministerie FROM normalized
      GROUP BY norm_ministerie
      ORDER BY SUM(totaal_avg) DESC
      LIMIT 5
    ),
    top_right AS (
      SELECT leverancier FROM normalized
      GROUP BY leverancier
      ORDER BY SUM(totaal_avg) DESC
      LIMIT 5
    )
    SELECT
      CASE WHEN n.norm_ministerie IN (SELECT norm_ministerie FROM top_left)
           THEN n.norm_ministerie ELSE 'Overige ministeries' END AS left_id,
      CASE WHEN n.leverancier IN (SELECT leverancier FROM top_right)
           THEN n.leverancier ELSE 'Overige leveranciers' END AS right_id,
      n.jaar AS year,
      SUM(n.totaal_avg) AS amount
    FROM normalized n
    GROUP BY left_id, right_id, year
  `)
  return buildStoryFromFlows('Inkoopdata', rows, 'Overige ministeries', 'Overige leveranciers')
}

async function generateGemeente(client) {
  console.log('  → Gemeente...')
  const { rows } = await client.query(`
    WITH top_left AS (
      SELECT gemeente FROM gemeente
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY gemeente
      ORDER BY SUM(bedrag) DESC
      LIMIT 6
    ),
    top_right AS (
      SELECT ontvanger FROM gemeente
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY ontvanger
      ORDER BY SUM(bedrag) DESC
      LIMIT 5
    )
    SELECT
      CASE WHEN g.gemeente IN (SELECT gemeente FROM top_left)
           THEN g.gemeente ELSE 'Overige gemeenten' END AS left_id,
      CASE WHEN g.ontvanger IN (SELECT ontvanger FROM top_right)
           THEN g.ontvanger ELSE 'Overige ontvangers' END AS right_id,
      g.jaar AS year,
      SUM(g.bedrag) AS amount
    FROM gemeente g
    WHERE g.jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
    GROUP BY left_id, right_id, year
  `)
  return buildStoryFromFlows('Gemeenten', rows, 'Overige gemeenten', 'Overige ontvangers')
}

async function generateProvincie(client) {
  console.log('  → Provincie...')
  const { rows } = await client.query(`
    WITH top_left AS (
      SELECT provincie FROM provincie
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY provincie
      ORDER BY SUM(bedrag) DESC
      LIMIT 6
    ),
    top_right AS (
      SELECT ontvanger FROM provincie
      WHERE jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY ontvanger
      ORDER BY SUM(bedrag) DESC
      LIMIT 5
    )
    SELECT
      CASE WHEN p.provincie IN (SELECT provincie FROM top_left)
           THEN p.provincie ELSE 'Overige provincies' END AS left_id,
      CASE WHEN p.ontvanger IN (SELECT ontvanger FROM top_right)
           THEN p.ontvanger ELSE 'Overige ontvangers' END AS right_id,
      p.jaar AS year,
      SUM(p.bedrag) AS amount
    FROM provincie p
    WHERE p.jaar BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
    GROUP BY left_id, right_id, year
  `)
  return buildStoryFromFlows('Provincies', rows, 'Overige provincies', 'Overige ontvangers')
}

async function generateIntegraal(client) {
  console.log('  → Integraal...')

  // Step 1: Get top 5 cross-module recipients (appear in 3+ modules)
  const { rows: topRecipients } = await client.query(`
    SELECT ontvanger, UPPER(ontvanger) AS upper_name
    FROM universal_search
    WHERE source_count >= 3
    ORDER BY totaal DESC
    LIMIT 5
  `)

  const upperNames = topRecipients.map((r) => r.upper_name)

  // Step 2: Query each module for flows to these recipients
  const moduleConfigs = [
    {
      name: 'Financiële instrumenten',
      table: 'instrumenten',
      recipientField: 'ontvanger',
      yearField: 'begrotingsjaar',
      amountExpr: 'bedrag::bigint * 1000',
    },
    {
      name: 'Inkoopuitgaven',
      table: 'inkoop',
      recipientField: 'leverancier',
      yearField: 'jaar',
      amountExpr: 'totaal_avg',
    },
    {
      name: 'Provinciale subsidies',
      table: 'provincie',
      recipientField: 'ontvanger',
      yearField: 'jaar',
      amountExpr: 'bedrag',
    },
    {
      name: 'Gemeentelijke subsidies',
      table: 'gemeente',
      recipientField: 'ontvanger',
      yearField: 'jaar',
      amountExpr: 'bedrag',
    },
    {
      name: 'Publiek (RVO/COA/NWO/ZonMW)',
      table: 'publiek',
      recipientField: 'ontvanger',
      yearField: 'jaar',
      amountExpr: 'bedrag',
    },
    {
      name: 'Apparaatsuitgaven',
      table: 'apparaat',
      recipientField: 'kostensoort',
      yearField: 'begrotingsjaar',
      amountExpr: 'bedrag::bigint * 1000',
    },
  ]

  const allFlows = []

  for (const mc of moduleConfigs) {
    const { rows } = await client.query(
      `
      SELECT
        CASE WHEN UPPER(${mc.recipientField}) = ANY($1::text[])
             THEN ${mc.recipientField}
             ELSE 'Overige ontvangers' END AS right_id,
        ${mc.yearField} AS year,
        SUM(${mc.amountExpr}) AS amount
      FROM ${mc.table}
      WHERE ${mc.yearField} BETWEEN ${YEAR_MIN} AND ${YEAR_MAX}
      GROUP BY right_id, year
    `,
      [upperNames]
    )

    for (const row of rows) {
      // Use universal_search label for matched recipients
      let rightLabel = row.right_id
      if (rightLabel !== 'Overige ontvangers') {
        const match = topRecipients.find((r) => r.upper_name === rightLabel.toUpperCase())
        if (match) rightLabel = match.ontvanger
      }

      allFlows.push({
        left_id: mc.name,
        right_id: rightLabel,
        year: Number(row.year),
        amount: Number(row.amount),
      })
    }
  }

  return buildStoryFromFlows('Alle bronnen', allFlows, null, 'Overige ontvangers')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    if (existsSync(OUTPUT_PATH)) {
      console.warn('⚠ DATABASE_URL not set — using existing geldstroom.json')
      return
    }
    throw new Error('DATABASE_URL not set and no existing geldstroom.json found')
  }

  const client = new pg.Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    console.log('✓ Connected to database')
    console.log('Generating De Geldstroom data...')

    const stories = {}

    stories.integraal = await generateIntegraal(client)
    stories.publiek = await generatePubliek(client)
    stories.instrumenten = await generateInstrumenten(client)
    stories.inkoop = await generateInkoop(client)
    stories.gemeente = await generateGemeente(client)
    stories.provincie = await generateProvincie(client)

    // Validate: check each story has data
    for (const [key, story] of Object.entries(stories)) {
      if (story.years.length === 0) {
        throw new Error(`Story "${key}" has no data — check database queries`)
      }
      console.log(`  ✓ ${key}: ${story.leftNodes.length} left, ${story.rightNodes.length} right, ${story.flows.length} flows, years ${story.years[0]}-${story.years[story.years.length - 1]}`)
    }

    const data = {
      generatedAt: new Date().toISOString(),
      stories,
    }

    // Ensure output directory exists
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true })

    // Write JSON
    const json = JSON.stringify(data, null, 2)
    writeFileSync(OUTPUT_PATH, json)
    console.log(`\n✓ Generated geldstroom.json (${(json.length / 1024).toFixed(1)} KB)`)
    console.log(`  Path: ${OUTPUT_PATH}`)
  } catch (error) {
    console.error('✗ Build script error:', error.message)

    // Fallback: check if existing JSON exists
    if (existsSync(OUTPUT_PATH)) {
      console.warn('⚠ Using existing geldstroom.json as fallback')
    } else {
      process.exit(1)
    }
  } finally {
    await client.end()
  }
}

main()
