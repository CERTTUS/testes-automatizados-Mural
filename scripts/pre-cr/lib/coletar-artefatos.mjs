import fs from 'node:fs'
import path from 'node:path'
import { repoRoot } from './paths.mjs'

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
  if (fs.existsSync(destino)) return
  fs.copyFileSync(origem, destino)
  copiados.push(label)
}

/** Copia só vídeos nomeados por CT — sem pastas do Playwright. */
function coletarVideosPorCt(runDir, root, copiados) {
  const evidenciasDir = path.join(runDir, 'evidencias')
  const testResults = path.join(root, 'test-results')
  const manifest = lerManifest(runDir)

  for (const entrada of manifest) {
    const ctId = entrada.ctId
    if (!ctId || !entrada.outputDir) continue

    const pastaTeste = path.join(root, entrada.outputDir)
    const destino = path.join(evidenciasDir, `${ctId}-gravacao.webm`)

    copiarSeExistir(
      path.join(pastaTeste, 'video.webm'),
      destino,
      copiados,
      `${ctId}-gravacao.webm`,
    )

    if (!fs.existsSync(destino)) {
      const candidato = path.join(testResults, path.basename(pastaTeste), 'video.webm')
      copiarSeExistir(candidato, destino, copiados, `${ctId}-gravacao.webm`)
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
      base.endsWith('.webm')
    )
  }).length
}

/**
 * Coleta mínima pós-run: só arquivos por CT em evidencias/ (plano).
 * Não copia html-report nem árvore test-results.
 * @param {string} runDir
 * @returns {string[]}
 */
export function coletarArtefatosPlaywright(runDir) {
  const root = repoRoot()
  const copiados = []

  const locais = contarEvidenciasLocais(runDir)
  if (locais > 0) {
    copiados.push(`evidencias/ (${locais} arquivo(s) por CT)`)
  }

  coletarVideosPorCt(runDir, root, copiados)

  return copiados
}
