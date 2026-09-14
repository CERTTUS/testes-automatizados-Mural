/**
 * Empacota docs + última run em zip harness-qa-pre-cr-<devKey>-<timestamp>.zip
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  copiarDocsModulo,
  copiarDirRecursivo,
  criarManifest,
  criarZip,
  nomeZip,
} from './lib/empacotar.mjs'
import { validarEvidenciasPreCr } from './lib/validar-evidencias-pre-cr.mjs'
import {
  formatTimestamp,
  garantirDir,
  parseArgs,
  repoRoot,
  resolverPastaEvidencias,
  resolverPastaZips,
  resolverUltimaRun,
} from './lib/paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogo = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo-modulos.json'), 'utf8'))
const produto = catalogo.produto || 'web'

const args = parseArgs(process.argv.slice(2))
if (!args.modulo || (!args.devKey && !args.prNumber)) {
  console.error('Uso: node scripts/pre-cr/empacotar-evidencias.mjs --modulo <slug> --dev-key <ISSUE>')
  process.exit(1)
}

const modulo = catalogo.modulos.find((m) => m.slug === args.modulo)
if (!modulo) {
  console.error(`Modulo desconhecido: ${args.modulo}`)
  process.exit(2)
}

const root = repoRoot()
const pastaBase = resolverPastaEvidencias({
  devKey: args.devKey,
  parentKey: args.parentKey,
  prNumber: args.prNumber,
  root,
})
const runDir = resolverUltimaRun(pastaBase)

if (!runDir) {
  console.error('[pre-cr] BLOQUEADO: nenhuma run em evidencias-pr — rode test:pre-cr antes.')
  process.exit(3)
}

const evidenciasValidacao = validarEvidenciasPreCr(runDir)
if (!evidenciasValidacao.ok && process.env.PRE_CR_SKIP_VALIDACAO !== '1') {
  console.error('[pre-cr] BLOQUEADO: CT(s) PASSOU sem evidência:')
  for (const f of evidenciasValidacao.faltando) {
    console.error(`  - ${f.ct}: ${f.motivo}`)
  }
  process.exit(3)
}
const timestamp = formatTimestamp()
const staging = garantirDir(path.join(pastaBase, '_staging', timestamp))
const docsDir = path.join(root, modulo.docs)

const docsCopiados = copiarDocsModulo(docsDir, staging)
if (runDir) {
  copiarDirRecursivo(runDir, path.join(staging, 'run'), { maxArquivos: 120 })
}

const veredito = runDir && fs.existsSync(path.join(runDir, 'resultado-execucao-dev.md'))
  ? fs.readFileSync(path.join(runDir, 'resultado-execucao-dev.md'), 'utf8').includes('PASSOU')
    ? 'PASSOU'
    : 'REPROVOU'
  : 'DESCONHECIDO'

const manifest = criarManifest({
  produto,
  devKey: args.devKey,
  parentKey: args.parentKey,
  prNumber: args.prNumber,
  modulo: modulo.slug,
  veredito,
  npmScript: modulo.npm,
  docsCopiados,
  runDir,
  evidenciasValidacao,
})

fs.writeFileSync(path.join(staging, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

const zipName = nomeZip(args.devKey ?? `PR-${args.prNumber}`, timestamp)
const zipPath = path.join(garantirDir(resolverPastaZips(pastaBase)), zipName)
criarZip(staging, zipPath)

fs.rmSync(path.join(pastaBase, '_staging'), { recursive: true, force: true })

console.log(`[pre-cr] Zip: ${zipPath}`)
console.log(`[pre-cr] Veredito: ${veredito}`)
