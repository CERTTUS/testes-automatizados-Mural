import fs from 'node:fs'
import path from 'node:path'
import { copiarDirRecursivo } from './empacotar.mjs'
import { garantirDir, repoRoot } from './paths.mjs'

const ORIGENS_PLAYWRIGHT = [
  { origem: 'test-results', destino: 'evidencias/traces' },
  { origem: 'playwright-report', destino: 'evidencias/html-report' },
]

/**
 * Copia artefatos Playwright da run atual para a pasta da execução.
 * @param {string} runDir
 * @returns {string[]}
 */
export function coletarArtefatosPlaywright(runDir) {
  const root = repoRoot()
  const copiados = []
  garantirDir(path.join(runDir, 'evidencias', 'screenshots'))

  for (const { origem, destino } of ORIGENS_PLAYWRIGHT) {
    const src = path.join(root, origem)
    const dst = path.join(runDir, destino)
    const n = copiarDirRecursivo(src, dst, { maxArquivos: 80 })
    if (n > 0) copiados.push(`${origem} (${n} arquivos)`)
  }

  const apiDir = garantirDir(path.join(runDir, 'evidencias', 'api'))
  const shotsDir = path.join(runDir, 'evidencias', 'screenshots')
  const testResults = path.join(root, 'test-results')
  if (fs.existsSync(testResults)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.isFile()) {
          const lower = entry.name.toLowerCase()
          if (lower.endsWith('-response.json') || (lower.includes('ct-api') && lower.endsWith('.json'))) {
            fs.copyFileSync(full, path.join(apiDir, entry.name))
            copiados.push(`api/${entry.name}`)
          } else if (lower.endsWith('-tela-final.png') || lower.includes('ct-smk')) {
            garantirDir(shotsDir)
            fs.copyFileSync(full, path.join(shotsDir, entry.name))
            copiados.push(`screenshots/${entry.name}`)
          }
        }
      }
    }
    walk(testResults)
  }

  return copiados
}
