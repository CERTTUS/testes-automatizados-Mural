import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { formatTimestamp, garantirDir } from './paths.mjs'

export { garantirDir }

const DOCS_COPIAR = [
  'contexto-pr.md',
  'escopo.md',
  'cenarios.md',
  'cobertura-diff.md',
  'resumo-implementacao.md',
  'resultado-execucao.md',
  'seletores.md',
]

export function copiarSeExistir(origem, destino) {
  if (!fs.existsSync(origem)) return false
  garantirDir(path.dirname(destino))
  fs.copyFileSync(origem, destino)
  return true
}

export function copiarDocsModulo(docsDir, stagingDir) {
  const copiados = []
  if (!fs.existsSync(docsDir)) return copiados
  for (const nome of DOCS_COPIAR) {
    const origem = path.join(docsDir, nome)
    const destino = path.join(stagingDir, nome)
    if (copiarSeExistir(origem, destino)) copiados.push(nome)
  }
  return copiados
}

export function copiarDirRecursivo(origem, destino, { maxArquivos = 200 } = {}) {
  if (!fs.existsSync(origem)) return 0
  let count = 0
  const walk = (src, dst) => {
    if (count >= maxArquivos) return
    const entries = fs.readdirSync(src, { withFileTypes: true })
    for (const entry of entries) {
      if (count >= maxArquivos) break
      const srcPath = path.join(src, entry.name)
      const dstPath = path.join(dst, entry.name)
      if (entry.isDirectory()) {
        garantirDir(dstPath)
        walk(srcPath, dstPath)
      } else if (entry.isFile()) {
        garantirDir(dst)
        fs.copyFileSync(srcPath, dstPath)
        count += 1
      }
    }
  }
  garantirDir(destino)
  walk(origem, destino)
  return count
}

export function criarManifest({
  produto,
  devKey,
  parentKey,
  prNumber,
  modulo,
  veredito,
  npmScript,
  docsCopiados,
  runDir,
  evidenciasValidacao,
}) {
  return {
    schema: 'harness-qa-pre-cr',
    versao: 2,
    produto,
    devKey: devKey ?? null,
    parentKey: parentKey ?? null,
    prNumber: prNumber ?? null,
    modulo,
    veredito,
    npmScript,
    geradoEm: new Date().toISOString(),
    docsCopiados,
    runDir: runDir ?? null,
    meloqa: 'nao-publicado-na-dev',
    evidenciasPorCt: evidenciasValidacao ?? { ok: true, faltando: [] },
  }
}

export function criarZip(pastaOrigem, arquivoZip) {
  garantirDir(path.dirname(arquivoZip))
  if (fs.existsSync(arquivoZip)) fs.unlinkSync(arquivoZip)

  if (process.platform === 'win32') {
    const ps = [
      'Compress-Archive',
      `-Path "${pastaOrigem}\\*"`,
      `-DestinationPath "${arquivoZip}"`,
      '-Force',
    ].join(' ')
    const result = spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`Falha ao criar zip: ${arquivoZip}`)
    return arquivoZip
  }

  const result = spawnSync('zip', ['-r', arquivoZip, '.'], { cwd: pastaOrigem, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`Falha ao criar zip: ${arquivoZip}`)
  return arquivoZip
}

export function nomeZip(devKey, timestamp = formatTimestamp()) {
  const chave = devKey ?? 'SEM-DEV-KEY'
  return `harness-qa-pre-cr-${chave}-${timestamp}.zip`
}
