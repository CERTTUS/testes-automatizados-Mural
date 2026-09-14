import fs from 'node:fs'
import path from 'node:path'
import { copiarDirRecursivo } from './empacotar.mjs'
import { garantirDir, repoRoot } from './paths.mjs'

const ORIGENS_PLAYWRIGHT = [
  { origem: 'playwright-report', destino: 'evidencias/html-report' },
]

function listarArquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listarArquivos(full, acc)
    else acc.push(full)
  }
  return acc
}

function lerManifest(runDir) {
  const manifestPath = path.join(runDir, 'evidencias', 'manifest-cts.jsonl')
  if (!fs.existsSync(manifestPath)) return []
  const porCt = new Map()
  for (const linha of fs.readFileSync(manifestPath, 'utf8').split('\n')) {
    const texto = linha.trim()
    if (!texto) continue
    try {
      const entrada = JSON.parse(texto)
      if (entrada.ctId) {
        porCt.set(entrada.ctId, { ...porCt.get(entrada.ctId), ...entrada })
      }
    } catch {
      /* ignora linha inválida */
    }
  }
  return [...porCt.values()]
}

function copiarSeExistir(origem, destino, copiados, label) {
  if (!fs.existsSync(origem)) return
  garantirDir(path.dirname(destino))
  fs.copyFileSync(origem, destino)
  copiados.push(label)
}

function coletarVideosETraces(runDir, root, copiados) {
  const videosDir = garantirDir(path.join(runDir, 'evidencias', 'videos'))
  const tracesDir = garantirDir(path.join(runDir, 'evidencias', 'traces'))
  const testResults = path.join(root, 'test-results')
  const manifest = lerManifest(runDir)
  const outputDirsManifest = new Set(
    manifest.map((e) => e.outputDir).filter(Boolean),
  )

  for (const entrada of manifest) {
    const ctId = entrada.ctId
    if (!ctId) continue

    if (entrada.outputDir) {
      const pastaTeste = path.join(root, entrada.outputDir)
      const pastaRelativa = entrada.outputDir.replace(/\\/g, '/')

      copiarSeExistir(
        path.join(pastaTeste, 'video.webm'),
        path.join(videosDir, `${ctId}-gravacao.webm`),
        copiados,
        `videos/${ctId}-gravacao.webm`,
      )
      copiarSeExistir(
        path.join(pastaTeste, 'trace.zip'),
        path.join(tracesDir, `${ctId}-trace.zip`),
        copiados,
        `traces/${ctId}-trace.zip`,
      )

      if (!fs.existsSync(path.join(pastaTeste, 'video.webm'))) {
        const candidato = path.join(testResults, path.basename(pastaTeste), 'video.webm')
        copiarSeExistir(
          candidato,
          path.join(videosDir, `${ctId}-gravacao.webm`),
          copiados,
          `videos/${ctId}-gravacao.webm`,
        )
      }
      continue
    }

    if (entrada.video && fs.existsSync(path.join(runDir, entrada.video))) {
      copiados.push(entrada.video)
    }
  }

  if (!fs.existsSync(testResults)) return

  for (const arquivo of listarArquivos(testResults)) {
    const base = path.basename(arquivo)
    const pastaRel = path.relative(testResults, path.dirname(arquivo)).replace(/\\/g, '/')
    if (outputDirsManifest.has(pastaRel)) continue

    if (base === 'video.webm') {
      const dest = path.join(videosDir, `${pastaRel.replace(/[/\\]/g, '_')}-gravacao.webm`)
      if (!fs.existsSync(dest)) {
        copiarSeExistir(arquivo, dest, copiados, `videos/${path.basename(dest)}`)
      }
    } else if (base === 'trace.zip') {
      const dest = path.join(tracesDir, `${pastaRel.replace(/[/\\]/g, '_')}-trace.zip`)
      if (!fs.existsSync(dest)) {
        copiarSeExistir(arquivo, dest, copiados, `traces/${path.basename(dest)}`)
      }
    }
  }
}

function contarEvidenciasLocais(runDir) {
  const evidenciasDir = path.join(runDir, 'evidencias')
  if (!fs.existsSync(evidenciasDir)) return 0
  return listarArquivos(evidenciasDir).filter((f) => {
    const base = path.basename(f).toLowerCase()
    return (
      base.endsWith('.png') ||
      base.endsWith('.json') ||
      base.endsWith('.webm') ||
      base.endsWith('.zip')
    )
  }).length
}

/**
 * Copia artefatos Playwright da run atual para a pasta da execução.
 * Screenshots/API já são gravados durante os testes em evidencias/.
 * @param {string} runDir
 * @returns {string[]}
 */
export function coletarArtefatosPlaywright(runDir) {
  const root = repoRoot()
  const copiados = []

  garantirDir(path.join(runDir, 'evidencias', 'screenshots'))
  garantirDir(path.join(runDir, 'evidencias', 'api'))
  garantirDir(path.join(runDir, 'evidencias', 'videos'))
  garantirDir(path.join(runDir, 'evidencias', 'traces'))

  const locais = contarEvidenciasLocais(runDir)
  if (locais > 0) {
    copiados.push(`evidencias/ (${locais} arquivos gravados na execução)`)
  }

  for (const { origem, destino } of ORIGENS_PLAYWRIGHT) {
    const src = path.join(root, origem)
    const dst = path.join(runDir, destino)
    const n = copiarDirRecursivo(src, dst, { maxArquivos: 120 })
    if (n > 0) copiados.push(`${origem} (${n} arquivos)`)
  }

  coletarVideosETraces(runDir, root, copiados)

  return copiados
}
