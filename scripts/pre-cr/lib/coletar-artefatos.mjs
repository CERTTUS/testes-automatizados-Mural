import fs from 'node:fs'
import path from 'node:path'
import { ehArquivoProvaCt } from './provas-run.mjs'
import { repoRoot } from './paths.mjs'

function lerManifest(runDir) {
  const manifestPath = path.join(runDir, 'manifest-cts.jsonl')
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
      /* ignora */
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

function coletarVideosPorCt(runDir, root, copiados) {
  const testResults = path.join(root, 'test-results')
  const manifest = lerManifest(runDir)

  for (const entrada of manifest) {
    const ctId = entrada.ctId
    if (!ctId || !entrada.outputDir) continue

    const pastaTeste = path.join(root, entrada.outputDir)
    const destino = path.join(runDir, `${ctId}-gravacao.webm`)

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

function contarProvasLocais(runDir) {
  if (!fs.existsSync(runDir)) return 0
  return fs.readdirSync(runDir).filter((nome) => ehArquivoProvaCt(nome)).length
}

/**
 * Coleta vídeos na raiz da run (mesma pasta das fotos e JSONs).
 * @param {string} runDir
 * @returns {string[]}
 */
export function coletarArtefatosPlaywright(runDir) {
  const root = repoRoot()
  const copiados = []

  const locais = contarProvasLocais(runDir)
  if (locais > 0) {
    copiados.push(`run/ (${locais} prova(s) por CT)`)
  }

  coletarVideosPorCt(runDir, root, copiados)

  return copiados
}
