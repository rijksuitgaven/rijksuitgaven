/**
 * Copy markdown files needed by the roadmap API into app/data/
 * so they're available at runtime on Railway (where root dir = app/).
 */
import { cpSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const appDir = process.cwd()
const repoRoot = resolve(appDir, '..')
const dataDir = join(appDir, 'data', 'roadmap')

mkdirSync(dataDir, { recursive: true })

const files = [
  { src: join(repoRoot, 'docs', 'VERSIONING.md'), dest: join(dataDir, 'VERSIONING.md') },
  { src: join(repoRoot, '02-requirements', 'backlog.md'), dest: join(dataDir, 'backlog.md') },
]

for (const { src, dest } of files) {
  if (existsSync(src)) {
    cpSync(src, dest)
    console.log(`[roadmap] Copied ${src} → ${dest}`)
  } else {
    console.warn(`[roadmap] Source not found: ${src}`)
  }
}
