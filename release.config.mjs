// release.config.mjs — fases da bateria de release (lido por scripts/release/run-release.mjs)
//
// Produto: Mural de Sugestões (repos de produto: mural-web e mural-api).
// Ambiente alvo: LOCAL (mural-web + mural-api no ar). O Mural não tem test-server nem CI hoje.
//
// O QUE A BATERIA COBRE
//   Para cada módulo em tests/e2e/specs/<modulo>/ são geradas, nesta ordem, as fases dos
//   arquivos que existirem:
//     1. api           → regra de negócio direto na API (ex.: teto de 2000 caracteres)
//     2. smoke         → mural abre autenticado e lista; formulário abre
//     3. e2e-feliz     → fluxos principais pela UI (grava sugestões "QA-E2E-*")
//     4. e2e-negativo  → validações e bloqueios pela UI
//   Hoje existe um único módulo: descricao-sugestao (IN-884).
//
// COMO OS MÓDULOS SÃO ORDENADOS
//   O catálogo scripts/pre-cr/catalogo-modulos.json NÃO tem campo de ordem; por isso os módulos
//   (pastas em tests/e2e/specs/) entram em ordem alfabética. Se um dia a ordem importar (ex.: o
//   menu do mural), acrescente um campo "ordem" no catálogo e ordene por ele aqui.
//   Novo módulo = nova pasta com os specs; as fases aparecem sozinhas (veja `npm run test:release:listar`).
//
// O QUE FICOU DE FORA E POR QUÊ
//   - Modo PRE_CR (npm run test:pre-cr): é o hop Dev — lento de propósito (slowMo 400, vídeo,
//     espera de 6s) e gera evidências. A release roda com PRE_CR=0.
//   - Jest dos repos de produto (mural-web / mural-api): vivem nos outros repositórios.
//   - npm run test:dev: depende do harness externo (HARNESS_HOME + Python).
//
// OBSERVAÇÕES
//   - Headless: o Playwright já roda headless por padrão (só abre janela com --headed). A variável
//     PW_HEADLESS usada pelo pre-CR NÃO é lida pelo playwright.config.ts.
//   - Stop-on-fail: PW_MAX_FAILURES=1 (padrão do config) + o executor para na primeira fase que falhar.
//   - Cada fase usa --workers=1: os specs de UI criam sugestões em massa compartilhada.
//   - As sugestões criadas pela UI (prefixo "QA-E2E") não são apagadas pelos testes hoje.
//   - O playwright-report/ é sobrescrito a cada fase; o log completo de cada fase fica em release-report/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const DIR_SPECS = path.join(RAIZ, 'tests', 'e2e', 'specs');

// Ordem fixa dentro de cada módulo: regra de negócio → listagem → fluxos.
const TIPOS = [
  { arquivo: 'api', rotulo: 'API' },
  { arquivo: 'smoke', rotulo: 'Smoke' },
  { arquivo: 'e2e-feliz', rotulo: 'E2E feliz' },
  { arquivo: 'e2e-negativo', rotulo: 'E2E negativo' },
];

function listarModulos() {
  if (!fs.existsSync(DIR_SPECS)) return [];
  return fs
    .readdirSync(DIR_SPECS, { withFileTypes: true })
    .filter((oEnt) => oEnt.isDirectory())
    .map((oEnt) => oEnt.name)
    .sort((a, b) => a.localeCompare(b));
}

function gerarFases() {
  const aFases = [];
  for (const sModulo of listarModulos()) {
    for (const oTipo of TIPOS) {
      const sSpec = `tests/e2e/specs/${sModulo}/${oTipo.arquivo}.spec.ts`;
      if (!fs.existsSync(path.join(RAIZ, sSpec))) continue;
      aFases.push({
        id: `${sModulo}-${oTipo.arquivo}`,
        nome: `${oTipo.rotulo} — ${sModulo}`,
        comando: `npx playwright test ${sSpec} --project=chromium --workers=1`,
      });
    }
  }
  return aFases;
}

export default {
  produto: 'Mural de Sugestões',
  relatorioDir: 'release-report',
  preVoo: {
    arquivosEnv: ['.env.local', '.env'],
    // Os padrões do código divergem (playwright.config.ts: 127.0.0.1:5173; tests/e2e/helpers/env.ts: localhost:8080),
    // então as duas URLs precisam estar explícitas no .env.local.
    envObrigatorias: ['E2E_BASE_URL', 'E2E_API_BASE_URL'],
    urls: [
      { nome: 'mural-web', env: 'E2E_BASE_URL', padrao: 'http://localhost:8080', caminho: '/', opcional: false },
      { nome: 'mural-api', env: 'E2E_API_BASE_URL', padrao: 'http://127.0.0.1:8085', caminho: '/', opcional: false },
    ],
    pastasTestes: ['tests'],
    proibirOnly: true,
  },
  envPadrao: {
    PW_MAX_FAILURES: '1',
    PRE_CR: '0',
  },
  fases: gerarFases(),
};
