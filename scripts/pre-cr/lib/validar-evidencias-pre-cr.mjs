import fs from 'node:fs'
import path from 'node:path'

const EXT_PROVA = ['.png', '.json', '.xml', '.webm', '.zip', '.md']

function listarArquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listarArquivos(full, acc)
    else acc.push(full)
  }
  return acc
}

function encontrarProva(runDir, ctId) {
  const evidencias = path.join(runDir, 'evidencias')
  const jestDir = path.join(runDir, 'jest')
  const todos = [...listarArquivos(evidencias), ...listarArquivos(jestDir)]

  const prefixo = ctId.toUpperCase()
  for (const arquivo of todos) {
    const base = path.basename(arquivo)
    if (!base.toUpperCase().includes(prefixo)) continue
    if (EXT_PROVA.some((ext) => base.toLowerCase().endsWith(ext))) {
      return path.relative(runDir, arquivo).replace(/\\/g, '/')
    }
  }

  if (prefixo.startsWith('CT-UNIT') || prefixo.startsWith('CT-JEST')) {
    for (const nome of ['junit.xml', 'resultado.json', 'resultado-validacao.json', 'run.log']) {
      const p = path.join(jestDir, nome)
      if (fs.existsSync(p)) return `jest/${nome}`
    }
  }

  return null
}

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
    const prova = encontrarProva(runDir, ct.id)
    if (!prova) {
      faltando.push({
        ct: ct.id,
        motivo: 'PASSOU sem screenshot, JSON, junit ou log rastreável',
      })
    }
  }

  if (cts.length === 0) {
    const temAlgumArtefato =
      listarArquivos(path.join(runDir, 'evidencias')).length > 0 ||
      listarArquivos(path.join(runDir, 'jest')).length > 0
    if (!temAlgumArtefato) {
      faltando.push({ ct: '(geral)', motivo: 'run sem pasta evidencias/ ou jest/' })
    }
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
