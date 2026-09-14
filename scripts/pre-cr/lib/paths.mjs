import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Raiz do repositório de testes. */
export function repoRoot() {
  return path.resolve(__dirname, '../../..')
}

/** Data/hora legível para pastas (ex.: 2026-09-14_15-09-11). */
export function formatTimestampLegivel(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_` +
    `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  )
}

/** Nome da pasta de execução: data legível + módulo. */
export function formatRunId(moduloSlug, date = new Date()) {
  const cBase = formatTimestampLegivel(date)
  const cSlug = String(moduloSlug || 'run')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
  return cSlug ? `${cBase}-${cSlug}` : cBase
}

/** Compacto para arquivos (zip, staging). */
export function formatTimestamp(date = new Date()) {
  return formatTimestampLegivel(date)
}

/**
 * Pasta base de evidências — âncora HU + subtarefa Dev.
 * @param {{ devKey?: string, parentKey?: string, prNumber?: string|number, root?: string }} opts
 */
export function resolverPastaEvidencias({ devKey, parentKey, prNumber, root = repoRoot() }) {
  const base = path.join(root, 'evidencias-pr')
  if (prNumber) return path.join(base, `PR-${prNumber}`)
  if (parentKey && devKey) {
    return path.join(base, parentKey, devKey)
  }
  if (parentKey) {
    return path.join(base, parentKey)
  }
  if (devKey) return path.join(base, devKey)
  throw new Error('Informe --dev-key <ISSUE> (e --parent-key <HU> quando possível) ou --pr <número>')
}

export function resolverPastaZips(pastaBase) {
  return path.join(pastaBase, 'zips')
}

export function pastaRun(pastaBase, runId = formatTimestamp()) {
  return path.join(pastaBase, 'runs', runId)
}

export function garantirDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--modulo' || token === '-m') {
      args.modulo = argv[++i]
    } else if (token === '--dev-key' || token === '--issue') {
      args.devKey = argv[++i]
    } else if (token === '--pr') {
      args.prNumber = argv[++i]
    } else if (token === '--ambiente') {
      args.ambiente = argv[++i]
    } else if (token === '--parent-key') {
      args.parentKey = argv[++i]
    } else if (token === '--output' || token === '-o') {
      args.output = argv[++i]
    } else if (token === '--stdout') {
      args.stdout = argv[++i]
    } else if (token === '--help' || token === '-h') {
      args.help = true
    } else if (token.startsWith('--')) {
      const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('-')) {
        args[key] = true
      } else {
        args[key] = argv[++i]
      }
    } else if (!token.startsWith('-')) {
      args._.push(token)
    }
  }
  return args
}
