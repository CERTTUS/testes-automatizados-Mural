# GUIA — Testes automatizados do Mural de Sugestões

Guia para quem **nunca** usou este repositório. Siga na ordem: instalar, configurar, rodar o primeiro teste e, depois, a bateria de release.

Comandos em PowerShell (Windows) primeiro; bash quando for diferente.

---

## 1. O que é este repositório

- **Produto testado:** o Mural de Sugestões da CERTTUS, onde usuários criam, editam e consultam sugestões de melhoria. O código do produto fica em outros repositórios: `mural-web` (front) e `mural-api` (back).
- **O que está coberto hoje:** a entrega IN-884 — limite de 2000 caracteres na descrição da sugestão e o botão "Ver mais / Ver menos" no card. Um único módulo: `descricao-sugestao`.
- **Tipos de teste** (todos em Playwright, na mesma pasta `tests/e2e/specs/<modulo>/`):

| Tipo | Arquivo | O que faz |
|---|---|---|
| API | `api.spec.ts` | Chama a `mural-api` direto (login de desenvolvimento, criar/atualizar/apagar sugestão) |
| Smoke | `smoke.spec.ts` | O mural abre autenticado, lista sugestões e abre o formulário |
| E2E feliz | `e2e-feliz.spec.ts` | Fluxos principais pela tela (criar, expandir, editar...) |
| E2E negativo | `e2e-negativo.spec.ts` | Validações e bloqueios pela tela |

- **Ferramenta:** Playwright (versão 1.63 no `package-lock.json`) + TypeScript, projeto ESM. Há um único projeto Playwright, chamado `chromium`.
- **Dois "modos" de uso:**
  - **Bateria de release** (`npm run test:release`) — roda tudo, antes de liberar versão (seção 8).
  - **Pre-CR** (`npm run test:pre-cr`) — rodada pontual do Dev com geração de evidências (screenshots, vídeos, zip para a PR). Não é a bateria de release.

## 2. Pré-requisitos

| Item | Detalhe |
|---|---|
| Node.js + npm | Versão exata não está fixada no repo (a confirmar). Use uma LTS atual; o executor da bateria usa `fetch` nativo, que exige Node 18+ |
| Google Chrome instalado | Fora de CI o `playwright.config.ts` usa `channel: 'chrome'`. Para usar o Chromium do Playwright, defina `E2E_USE_CHROMIUM=1` |
| Git | Para clonar e abrir PR |
| `mural-web` no ar | Porta típica `8080` (veja a seção 4 — o padrão do código não é único) |
| `mural-api` no ar | Porta típica `8085`, com o endpoint de login de desenvolvimento `POST /autenticacao/dev-login` habilitado |
| Massa de dados no ambiente | Produto **"Sistema Certtus"** e pilar de gestão **"Produtividade"** cadastrados; pelo menos uma sugestão na listagem; usuário de teste cadastrado (padrão `admin@certtus.com`) |
| Python + `HARNESS_HOME` | **Somente** para `npm run test:dev` (harness externo). Não é necessário para o resto |

Acessos: ao repositório `testes-automatizados-Mural` e, para subir o produto localmente, aos repositórios `mural-web` e `mural-api` (as instruções de como subi-los ficam nesses repositórios).

## 3. Instalação passo a passo

```powershell
git clone <url-do-repositorio-testes-automatizados-Mural>
cd testes-automatizados-Mural
git switch develop
npm install
npx playwright install chromium chrome
```

O último comando baixa os navegadores usados pelo Playwright. Se o Chrome já está instalado na máquina, o `chrome` pode ser dispensado.

## 4. Configurar o ambiente

1. Copie o modelo (o arquivo `.env.local` é ignorado pelo Git — **nunca** commite):

   ```powershell
   copy .env.example .env.local
   ```

   ```bash
   cp .env.example .env.local
   ```

2. Ajuste os valores. O `playwright.config.ts` lê `.env.local` e depois `.env`; variáveis já definidas no terminal têm prioridade.

| Variável | Para que serve | Obrigatória? | Exemplo (sem segredo) |
|---|---|---|---|
| `E2E_BASE_URL` | URL do `mural-web` | Sim (na prática) | `http://localhost:8080` |
| `E2E_API_BASE_URL` | URL da `mural-api` | Sim (na prática) | `http://127.0.0.1:8085` |
| `E2E_TEST_EMAIL` | E-mail usado no login de desenvolvimento | Não (padrão `admin@certtus.com`) | `admin@certtus.com` |
| `PW_MAX_FAILURES` | Para a execução após N falhas. Padrão `1`; `0` desliga e roda tudo | Não | `0` |
| `E2E_USE_CHROMIUM` | `1` = usa o Chromium do Playwright em vez do Chrome instalado | Não | `1` |
| `E2E_SLOW_MO` | Atraso (ms) entre ações, útil para assistir o teste | Não | `300` |
| `E2E_REPORTER_LISTA` | `1` = lista com os passos (`printSteps`) | Não | `1` |
| `PRE_CR` | Modo evidências; é definido pelo `npm run test:pre-cr`, não ligue à mão | Não | — |
| `HARNESS_HOME` | Pasta do harness externo, só para `npm run test:dev` | Só no `test:dev` | caminho local |

> **Atenção às portas padrão.** Quando `E2E_BASE_URL` não está definida, o `playwright.config.ts` assume `http://127.0.0.1:5173`, mas `tests/e2e/helpers/env.ts` e o `.env.example` assumem `http://localhost:8080`. Por isso a bateria de release **exige** as duas variáveis `E2E_*_URL` preenchidas. Esta incoerência está registrada em [docs/melhorias-estrutura.md](docs/melhorias-estrutura.md).

## 5. Primeiro teste em 5 minutos

Com `mural-web` e `mural-api` no ar e o `.env.local` preenchido:

```powershell
npx playwright test tests/e2e/specs/descricao-sugestao/smoke.spec.ts --project=chromium
```

Deu certo quando a saída termina com algo como `2 passed`. Os dois testes são `CT-SMK-01` (mural lista sugestões) e `CT-SMK-02` (formulário abre com o contador `0/2000`).

Se falhar, veja a seção 12.

## 6. Estrutura de pastas

```text
.
├── tests/e2e/
│   ├── specs/<modulo>/          # um módulo por pasta: api, smoke, e2e-feliz, e2e-negativo
│   │   └── descricao-sugestao/
│   ├── pages/                   # Page Objects (LoginPage, MuralPage, FormularioSugestaoPage)
│   ├── helpers/                 # env.ts (variáveis), api.ts (cliente da mural-api), pre-cr/ (evidências)
│   └── fixtures.ts              # exporta test/expect; fixture automática de evidência do pre-CR
├── scripts/
│   ├── release/run-release.mjs  # executor da bateria de release (igual em todos os repos de teste)
│   ├── pre-cr/                  # rodada pontual do Dev: catálogo, execução, zip, corpo da PR
│   └── run-test-dev.mjs         # atalho para o harness externo
├── release.config.mjs           # fases da bateria de release deste repo
├── playwright.config.ts         # configuração do Playwright
├── qa-pre-cr.json               # manifesto do pre-CR
├── docs/                        # docs/tests/ é local (ignorado, exceto README); melhorias-estrutura.md
├── evidencias-pr/               # saída do pre-CR
└── release-report/              # saída da bateria de release (ignorada pelo Git, criada ao rodar)
```

## 7. Como rodar

| Quero rodar | Comando |
|---|---|
| Um teste pelo nome | `npx playwright test --project=chromium -g "CT-SMK-02"` |
| Um arquivo | `npx playwright test tests/e2e/specs/descricao-sugestao/api.spec.ts --project=chromium` |
| Um módulo (pasta) | `npx playwright test tests/e2e/specs/descricao-sugestao --project=chromium` |
| A suíte inteira | `npm run test:e2e` (para na 1ª falha) |
| A suíte inteira sem parar na falha | PowerShell: `$env:PW_MAX_FAILURES='0'; npm run test:e2e` — bash: `PW_MAX_FAILURES=0 npm run test:e2e` |
| Com o navegador visível | `npm run test:e2e:headed` |
| Passo a passo no Inspector | `npm run test:e2e:debug` |
| Assistir mais devagar | PowerShell: `$env:E2E_SLOW_MO='300'; npm run test:e2e:headed` |

Por padrão os testes rodam **sem janela** (headless); só abrem janela com `--headed`.

Onde ver o resultado:

| O quê | Onde |
|---|---|
| Relatório HTML | `npx playwright show-report` (pasta `playwright-report/`) |
| Screenshot, vídeo e trace de falhas | pasta `test-results/` (screenshot e vídeo só em falha; trace só quando há repetição, o que hoje acontece apenas em CI) |
| Evidências do pre-CR | `evidencias-pr/<HU>/<DEV>/runs/atual/` |

Rodada pontual do Dev (pre-CR), exemplo:

```powershell
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
```

Ela liga o modo `PRE_CR`, que é lento de propósito (gravação de vídeo, atraso entre ações) e gera evidências. Outros comandos de apoio: `npm run pre-cr:modulos` (lista módulos), `npm run pre-cr:empacotar`, `npm run pre-cr:corpo-pr`, `npm run pre-cr:bootstrap`.

## 8. Bateria de release

Um comando roda todos os testes que validam o sistema, em sequência, e para na primeira falha:

```powershell
npm run test:release
```

Para só ver as fases sem executar: `npm run test:release:listar`.

### Fases (ordem de execução)

As fases são **geradas** a partir de `tests/e2e/specs/<modulo>/` (módulos em ordem alfabética, pois o catálogo não tem campo de ordem). Hoje:

| # | Id | O que cobre | Duração estimada |
|---|---|---|---|
| 1 | `descricao-sugestao-api` | 6 testes de API: teto de 2000 caracteres, 2001, só espaços, sem o campo, atualização | a confirmar |
| 2 | `descricao-sugestao-smoke` | 2 testes: mural lista; formulário abre com `0/2000` | a confirmar |
| 3 | `descricao-sugestao-e2e-feliz` | 6 testes seriais: criar, Ver mais/menos, detalhes, editar até 2000, curta sem botão, carrossel "Minhas Sugestões" | a confirmar |
| 4 | `descricao-sugestao-e2e-negativo` | 2 testes: descrição em branco, bloqueio do 2001º caractere | a confirmar |

Novo módulo (nova pasta em `tests/e2e/specs/`) ganha suas fases automaticamente, na ordem api, smoke, e2e-feliz, e2e-negativo, para os arquivos que existirem.

### Opt-ins

Não há fases opt-in hoje.

### O que fica fora e por quê

| Fora da bateria | Motivo |
|---|---|
| `npm run test:pre-cr` | É o hop Dev: lento de propósito (vídeo, atrasos) e gera evidências |
| `npm run test:dev` | Depende de harness externo (`HARNESS_HOME` + Python) |
| Testes Jest de `mural-web` / `mural-api` | Ficam nos repositórios do produto |

### Opções úteis

| Quero | Como |
|---|---|
| Retomar a partir de uma fase | `npm run test:release -- --de=descricao-sugestao-e2e-feliz` |
| Rodar só algumas fases | `npm run test:release -- --so=descricao-sugestao-api,descricao-sugestao-smoke` |
| Pular fases | `npm run test:release -- --pular=descricao-sugestao-smoke` |
| Não parar na 1ª falha | `npm run test:release -- --continuar` |
| Incluir fase opt-in | `npm run test:release -- --incluir=<id>` |
| Pular o pré-voo (não recomendado) | `npm run test:release -- --sem-pre-voo` |

O executor também aceita as variáveis `RELEASE_DE`, `RELEASE_SO`, `RELEASE_PULAR`, `RELEASE_INCLUIR`, `RELEASE_CONTINUAR=1` e `RELEASE_SEM_PRE_VOO=1`.

### Relatório e critério de aprovação

- O relatório fica em `release-report/<AAAAMMDD-HHmmss>/`: `resumo.md`, `resumo.json` e um `<fase>.log` por fase.
- **Aprovado = saída com código 0** (o `resumo.md` mostra "APROVADO"). Código 1 = alguma fase falhou; código 2 = pré-voo ou configuração inválida.
- O `playwright-report/` é sobrescrito a cada fase. Em caso de falha a bateria para, então ele reflete a fase que falhou.

### Checklist antes de rodar

- [ ] Estou na `develop` atualizada (`git switch develop` e `git pull`)
- [ ] `mural-web` e `mural-api` no ar, apontando para o ambiente alvo (local)
- [ ] `.env.local` com `E2E_BASE_URL` e `E2E_API_BASE_URL` preenchidas
- [ ] Massa existente: produto "Sistema Certtus", pilar "Produtividade", usuário de teste e ao menos uma sugestão
- [ ] Nenhum `.only` esquecido (o pré-voo também verifica)
- [ ] Sei que o E2E feliz cria sugestões `QA-E2E-*` que não são apagadas automaticamente

## 9. Fluxo de branches e versões

```text
main      ← só recebe código quando uma versão é liberada (PR develop → main)
develop   ← integração: toda branch de teste abre PR para cá
test/<TICKET>-<slug> · feat/… · fix/… · chore/…   ← criadas a partir da develop
```

Dia a dia:

1. `git switch develop` e `git pull`
2. `git switch -c test/IN-1234-descricao-curta`
3. Commits pequenos → `git push -u origin <branch>` → abrir PR **com base na develop** (não na main)
4. Revisão + testes do módulo verdes → merge na develop

Liberação de versão:

1. develop atualizada e estável
2. Rodar `npm run test:release` a partir da develop, no ambiente alvo → precisa sair **APROVADO**
3. Abrir PR **develop → main** colando o `release-report/<data>/resumo.md`
4. Merge na main (opcional: tag `vAAAA.MM.DD`)

Hotfix: branch `hotfix/<TICKET>` a partir da main → PR para a main → depois levar a main para a develop (PR main → develop).

## 10. Como criar um teste novo

1. **Escolha o módulo.** Cada entrega tem uma pasta `tests/e2e/specs/<slug>/` (ex.: `descricao-sugestao`). Para um módulo novo, o caminho previsto é `npm run pre-cr:bootstrap -- --from-diff --parent-key <HU> --dev-key <DEV>`, que registra o slug no catálogo `scripts/pre-cr/catalogo-modulos.json`.
2. **Crie o arquivo** com um destes nomes: `api.spec.ts`, `smoke.spec.ts`, `e2e-feliz.spec.ts`, `e2e-negativo.spec.ts`. A bateria de release encontra esses nomes sozinha.
3. **Importe `test` e `expect` de `../../fixtures`** (não de `@playwright/test`) e os Page Objects de `../../pages/`.
4. **Título no padrão** `CT-<TIPO>-NN — descrição` (`CT-API-`, `CT-SMK-`, `CT-E2E-`). O pre-CR usa o `CT-...` para nomear as evidências.
5. **Seletores nos Page Objects** (`tests/e2e/pages/`), não no spec. Ordem de preferência: `data-testid`, depois `aria-label`, depois `role`. No `mural-web`, o QA só adiciona `data-testid`.
6. **Nomes de variáveis** com prefixo húngaro, como no resto do código: `c` texto, `n` número, `m` lista, `o` objeto, `l` booleano (ex.: `cTitulo`, `nProduto`, `mLimpar`).
7. **Dados:** gere títulos únicos com prefixo `QA-E2E` / `QA-API` e `Date.now()`. Apague o que criar quando houver endpoint (veja `deletarSugestaoApi` em `tests/e2e/helpers/api.ts`).
8. **Rode** o arquivo isolado e depois a bateria.

Exemplo mínimo (baseado em `tests/e2e/specs/descricao-sugestao/smoke.spec.ts`):

```ts
import {expect, test} from '../../fixtures';
import {LoginPage} from '../../pages/LoginPage';
import {MuralPage} from '../../pages/MuralPage';

test.describe('Smoke — meu módulo', () => {
   test.beforeEach(async ({page}) => {
      await new LoginPage(page).garantirSessao();
   });

   test('CT-SMK-03 — Abrir o mural e ver a listagem', async ({page}) => {
      const oMural = new MuralPage(page);
      await expect(oMural.listagem()).toBeVisible();
   });
});
```

Para chamar a API, use as funções de `tests/e2e/helpers/api.ts` (`autenticarApi`, `criarSugestaoApi`, `deletarSugestaoApi`...), como em `api.spec.ts`.

## 11. Regras de ouro

- **Nunca** use espera fixa (`waitForTimeout`). Hoje não há nenhuma; use `expect(...)` com auto-espera.
- **Nunca** deixe `test.only` / `describe.only` (o pré-voo reprova).
- **Nunca** rode contra produção nem com dados reais; o alvo é ambiente local/de teste.
- **Nunca** commite `.env`, `.env.local`, `playwright-report/`, `test-results/`, `release-report/`.
- **Sempre** um teste independente do outro; se precisar de ordem, justifique (hoje só o `e2e-feliz` é serial).
- **Sempre** seletor estável (`data-testid`) em Page Object; evite classe CSS.
- **Sempre** limpe o que criou, quando houver como.
- Não altere `mural-web` / `mural-api` além de adicionar `data-testid`.
- Falha que parece bug do produto: não "ajuste o teste para passar" — documente e escale.

## 12. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Pré-voo: "Variável obrigatória vazia: E2E_BASE_URL" | `.env.local` ausente ou incompleto | `copy .env.example .env.local` e preencha |
| Pré-voo: "Serviço fora do ar" | `mural-web` ou `mural-api` parado, ou URL/porta errada | Suba o serviço; confira a porta no `.env.local` |
| `Falha no dev-login (...)` | API sem o endpoint `/autenticacao/dev-login`, e-mail inexistente ou URL da API errada | Confira `E2E_API_BASE_URL` e `E2E_TEST_EMAIL`; use a API em modo desenvolvimento |
| `Massa de produto/pilar ausente na API local.` | Banco sem produto ou pilar | Cadastre a massa no ambiente |
| Todos os testes de tela falham em `page.goto` / timeout | `E2E_BASE_URL` não definida (config assume `127.0.0.1:5173`) | Defina `E2E_BASE_URL` |
| `Executable doesn't exist` / Chrome não encontrado | Navegador não instalado | `npx playwright install chromium chrome` ou `E2E_USE_CHROMIUM=1` |
| Execução para após 1 falha | `PW_MAX_FAILURES` padrão é 1 | `PW_MAX_FAILURES=0` para rodar tudo |
| `CT-E2E-02/03/04/06` falham em cascata | Dependem do `CT-E2E-01` (modo serial) | Corrija o `CT-E2E-01` primeiro |
| O pre-CR roda só o smoke e a API fica de fora, sem aviso | `ehSpecApi` só reconhece `/tests/api/` (problema conhecido) | Ver [docs/melhorias-estrutura.md](docs/melhorias-estrutura.md); enquanto isso rode o `api.spec.ts` direto com Playwright |
| `test:dev` não acha `HARNESS_HOME` | Variável não definida | Defina `HARNESS_HOME` (ou `.env-cursor`) e tenha Python instalado |

## 13. Documentos relacionados

- [README.md](README.md) — visão geral e comandos do pre-CR
- [docs/melhorias-estrutura.md](docs/melhorias-estrutura.md) — análise e sugestões de melhoria deste repo
- [evidencias-pr/README.md](evidencias-pr/README.md) — layout das evidências do pre-CR
- [docs/tests/README.md](docs/tests/README.md) — pasta local da rodada do pipeline
- [tests/e2e/specs/README.md](tests/e2e/specs/README.md) e [tests/e2e/pages/README.md](tests/e2e/pages/README.md)
- `release.config.mjs` — fases da bateria, comentadas
