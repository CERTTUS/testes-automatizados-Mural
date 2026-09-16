import fs from 'node:fs'
import path from 'node:path'
import { encontrarProvaRun, listarProvasRun } from './provas-run.mjs'

/**
 * Valida evidências mínimas por CT (PASS exige prova).
 * @param {string} runDir
 * @param {{ cts?: Array<{ id: string, status?: string }> }} opts
 * @returns {{ ok: boolean, faltando: Array<{ ct: string, motivo: string }> }}
 */
export function validarEvidenciasPreCr(runDir, opts = {}) {
  const faltando = []
  const cts = opts.cts ?? extrairCtsDoResultado(runDir)

  for (const ct of cts) {
    if (ct.status && ct.status !== 'PASSOU' && ct.status !== 'passed') continue
    const id = ct.id.toUpperCase()
    if (id.includes('E2E') && !id.includes('SMK')) continue
    const arquivos = listarProvasRun(runDir)
      .filter((arquivo) => path.basename(arquivo).toUpperCase().includes(id))
      .map((arquivo) => arquivo.toLowerCase())
    if (id.includes('SMK')) {
      const temPng = arquivos.some((a) => a.endsWith('.png'))
      const temVideo = arquivos.some((a) => a.endsWith('.webm') || a.endsWith('.mp4'))
      if (!temPng || !temVideo) {
        faltando.push({
          ct: ct.id,
          motivo: 'CT-SMK PASSOU exige PNG e vídeo do ciclo (.webm)',
        })
      }
      continue
    }
    const prova = encontrarProvaRun(runDir, ct.id)
    if (!prova) {
      faltando.push({
        ct: ct.id,
        motivo: 'PASSOU sem screenshot, JSON, vídeo ou log rastreável',
      })
    }
  }

  if (cts.length === 0 && listarProvasRun(runDir).length === 0) {
    faltando.push({ ct: '(geral)', motivo: 'run sem arquivos de prova por CT' })
  }

  return { ok: faltando.length === 0, faltando }
}

function extrairCtsDoResultado(runDir) {
  const arquivo = path.join(runDir, 'resultado-execucao-dev.md')
  if (!fs.existsSync(arquivo)) return []

  const texto = fs.readFileSync(arquivo, 'utf8')
  const cts = []
  for (const linha of texto.split('\n')) {
    const match = linha.match(
      /^\|\s*((?:CT|CEN)-[A-Z0-9-]+)\s*\|\s*[^|]+\s*\|\s*([^|]+)\s*\|/i,
    )
    if (!match) continue
    const status = match[2].trim().toUpperCase()
    if (status === 'PASSOU' || status === 'PASSED') {
      cts.push({ id: match[1].toUpperCase(), status: 'PASSOU' })
    }
  }
  return cts
}
