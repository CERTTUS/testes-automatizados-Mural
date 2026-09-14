import fs from 'node:fs'
import path from 'node:path'

const EXT_PROVA = ['.png', '.json', '.xml', '.webm']

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
  const pastas = [path.join(runDir, 'evidencias'), path.join(runDir, 'jest')]
  const prefixo = ctId.toUpperCase()
  const todos = pastas.flatMap((p) => listarArquivos(p))

  for (const arquivo of todos) {
    const base = path.basename(arquivo)
    if (!base.toUpperCase().includes(prefixo)) continue
    if (EXT_PROVA.some((ext) => base.toLowerCase().endsWith(ext))) {
      return path.relative(runDir, arquivo).replace(/\\/g, '/')
    }
  }

  if (prefixo.startsWith('CT-UNIT') || prefixo.startsWith('CT-JEST') || prefixo.startsWith('CEN-UNIT')) {
    for (const nome of ['junit.xml', 'resultado.json', 'resultado-validacao.json', 'run.log']) {
      const p = path.join(runDir, 'jest', nome)
      if (fs.existsSync(p)) return `jest/${nome}`
    }
  }

  return null
}

function extrairIdsCenarios(cenariosMd) {
  const ids = new Set()
  const re = /\b((?:CT|CEN)-[A-Z0-9-]+)\b/gi
  let match
  while ((match = re.exec(cenariosMd)) !== null) {
    ids.add(match[1].toUpperCase())
  }
  return [...ids]
}

function titulosCenarios(cenariosMd) {
  const titulos = []
  for (const linha of cenariosMd.split('\n')) {
    const m = linha.match(/^###\s+(.+)/)
    if (m) titulos.push(m[1].trim())
  }
  return titulos.slice(0, 8)
}

function inferirTipo(ctId) {
  const id = ctId.toUpperCase()
  if (id.includes('UNIT') || id.includes('JEST')) return 'jest'
  if (id.includes('API') || id.startsWith('CEN-API')) return 'api'
  if (id.includes('SMK') || id.startsWith('CEN-E2E')) return 'smoke'
  if (id.includes('MAN')) return 'manual'
  return 'outro'
}

/**
 * Gera resultado-execucao-dev.md + plano-execucao.json na pasta da run.
 */
export function gerarResultadoExecucaoDev({
  runDir,
  root,
  modulo,
  produto,
  devKey,
  parentKey,
  exitCode,
  npmScript,
  ambiente = 'local',
}) {
  const cenariosPath = path.join(root, modulo.docs, 'cenarios.md')
  const cenariosMd = fs.existsSync(cenariosPath) ? fs.readFileSync(cenariosPath, 'utf8') : ''
  const ids = extrairIdsCenarios(cenariosMd)
  const veredito = exitCode === 0 ? 'PASSOU' : 'REPROVOU'
  const dataIso = new Date().toISOString()

  const linhasEvidencia = []
  const porTipo = { jest: 0, api: 0, smoke: 0, manual: 0, outro: 0 }

  for (const id of ids) {
    const tipo = inferirTipo(id)
    if (tipo === 'manual') {
      porTipo.manual += 1
      linhasEvidencia.push(`| ${id} | manual | ○ | — |`)
      continue
    }
    const prova = encontrarProva(runDir, id)
    const status = veredito === 'PASSOU' && prova ? 'PASSOU' : veredito === 'PASSOU' ? 'SEM_PROVA' : 'REPROVOU'
    if (status === 'PASSOU') {
      porTipo[tipo] = (porTipo[tipo] ?? 0) + 1
    }
    linhasEvidencia.push(
      `| ${id} | ${tipo} | ${status} | ${prova ? `\`${prova}\`` : '—'} |`,
    )
  }

  if (linhasEvidencia.length === 0) {
    linhasEvidencia.push('| — | — | — | *(sem CTs em cenarios.md)* |')
  }

  const titulos = titulosCenarios(cenariosMd)
  const resumoHumano = titulos.length
    ? titulos.map((t) => `- ${t.replace(/`/g, '')}`).join('\n')
    : '- (sem títulos em cenarios.md)'

  const resultado = [
    '# resultado-execucao-dev',
    '',
    `> Dev: \`${devKey ?? '—'}\` | HU: \`${parentKey ?? devKey ?? '—'}\` | Módulo: \`${modulo.slug}\``,
    `> Data: ${dataIso}`,
    '',
    `Veredito: **${veredito}**`,
    '',
    `Comando: \`npm run ${npmScript} -- --modulo ${modulo.slug} --dev-key ${devKey ?? '—'}${parentKey ? ` --parent-key ${parentKey}` : ''}\``,
    `Ambiente: \`${ambiente}\``,
    '',
    '---',
    '',
    '## O que foi testado (linguagem de tela)',
    '',
    resumoHumano,
    '',
    'E2E completo e checklist manual ficam para o QA.',
    '',
    '---',
    '',
    '## Resumo',
    '',
    '| Métrica | Valor |',
    '|---------|-------|',
    `| API | ${porTipo.api} com prova |`,
    `| Smoke | ${porTipo.smoke} com prova |`,
    `| Manual | ${porTipo.manual} (não executado no Dev) |`,
    `| Duração | — |`,
    '',
    '---',
    '',
    '## Evidências por CT (obrigatório no PASS)',
    '',
    '| CT | Tipo | Status | Arquivo de prova |',
    '|----|------|--------|------------------|',
    ...linhasEvidencia,
    '',
  ]

  fs.writeFileSync(path.join(runDir, 'resultado-execucao-dev.md'), resultado.join('\n'), 'utf8')

  const plano = {
    schema: 'qa-pre-cr-plano-execucao',
    devKey: devKey ?? null,
    parentKey: parentKey ?? devKey ?? null,
    modulo: modulo.slug,
    produto,
    ambiente,
    npmScript,
    comando: `npm run ${npmScript} -- --modulo ${modulo.slug} --dev-key ${devKey ?? ''}${parentKey ? ` --parent-key ${parentKey}` : ''}`,
    veredito,
    resumoHumano: titulos,
    executadoEm: dataIso,
    cts: ids.map((id) => ({
      id,
      tipo: inferirTipo(id),
      prova: encontrarProva(runDir, id),
    })),
  }

  fs.writeFileSync(
    path.join(runDir, 'plano-execucao.json'),
    `${JSON.stringify(plano, null, 2)}\n`,
    'utf8',
  )

  return plano
}
