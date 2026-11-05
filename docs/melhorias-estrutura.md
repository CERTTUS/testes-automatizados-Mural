# Melhorias de estrutura — testes automatizados do Mural

Análise do repositório `testes-automatizados-Mural` com sugestões priorizadas. Todas as evidências foram conferidas no código (caminho:linha).

## 1. Resumo do estado atual

- **1 módulo** (`descricao-sugestao`, entrega IN-884), **4 arquivos de spec** e **16 testes**: API 6, smoke 2, E2E feliz 6 (serial), E2E negativo 2.
- **Playwright 1.63** (lock), TypeScript, ESM; **1 projeto** (`chromium`), sem projeto de setup nem de API.
- **Scripts:** 12 scripts em `package.json` (antes da bateria de release); `scripts/pre-cr/` com 17 arquivos `.mjs` (cerca de 2.300 linhas) que cuidam do fluxo pre-CR (evidências, zip, corpo da PR); `scripts/run-test-dev.mjs` chama um harness externo (Python).
- **Sem CI** (nenhum workflow neste repo). `forbidOnly` e `retries` só valem quando `CI` está definida.
- **Sem `waitForTimeout`** e sem `.only` esquecido: a base de esperas é saudável.
- **Pre-CR domina o repositório:** o código de evidência (`tests/e2e/helpers/pre-cr/`, fixture automática, `evidencias-pr/`) é maior que a suíte de testes em si.

## 2. Problemas encontrados

| Severidade | Problema | Evidência | Impacto |
|---|---|---|---|
| **Alta** | O pre-CR descarta a camada de API sem aviso: `ehSpecApi` só reconhece `/tests/api/`, mas o `api.spec.ts` está em `tests/e2e/specs/...`. O manifesto declara `camadas.api: true` | `scripts/pre-cr/lib/executar-specs.mjs:7-10`, `:36`; `scripts/pre-cr/run-pre-cr.mjs:79,81`; `qa-pre-cr.json` (`camadas`) | O hop Dev roda só o smoke, e a evidência de API não é gerada. Falsa sensação de cobertura |
| **Alta** | `.gitignore` de `evidencias-pr` não funciona como esperado: `evidencias-pr/*` só ignora o 1º nível e `!evidencias-pr/**/` reinclui todos os diretórios. Resultado: artefatos de execução versionados | `.gitignore:33-37`; `git ls-files evidencias-pr` retorna 24 arquivos (5 `corpo-pr*.md`, 15 arquivos em `runs/historico/*`, 1 PNG, 2 zips, README) | Repositório acumula lixo de execuções; risco de vazar dado de ambiente |
| **Alta** | Dois zips idênticos versionados (mesmo MD5, 1,1 MB cada), em `zips/` e `zips__2/` | `evidencias-pr/IN-884/IN-891/zips/` e `zips__2/` | Peso desnecessário; `zips__2` é resíduo de renomeação de nome legado |
| Média | A fixture automática `_evidenciaPreCr` depende de `page`, então testes de API também abrem navegador/contexto | `tests/e2e/fixtures.ts:7,16,27` | Testes de API mais lentos e acoplados a UI |
| Média | Login pela UI em todos os testes de tela (`garantirSessao` em `beforeEach`), sem `storageState` | `tests/e2e/pages/LoginPage.ts:7-19`; chamado no `beforeEach` de `smoke.spec.ts:9`, `e2e-feliz.spec.ts:17` e `e2e-negativo.spec.ts:8` | Tempo gasto repetindo login; mais pontos de falha |
| Média | `e2e-feliz` é serial: CT-E2E-02, 03, 04 e 06 dependem da sugestão criada no CT-E2E-01 | `tests/e2e/specs/descricao-sugestao/e2e-feliz.spec.ts:13,21` (e títulos compartilhados na linha 15-16) | Uma falha derruba os testes seguintes; não dá para rodar um deles isolado |
| Média | Sugestões criadas pela UI nunca são apagadas (`QA-E2E-*`) | `e2e-feliz.spec.ts:13-14`; `e2e-negativo.spec.ts:15` só confere que não criou | Massa cresce a cada rodada; listagem fica poluída |
| Média | Produto e pilar hardcoded nos specs | `e2e-feliz.spec.ts:7-8`; `e2e-negativo.spec.ts:19-20` | Quebra se o nome mudar no ambiente |
| Média | Porta padrão incoerente: config `127.0.0.1:5173`, helper e `.env.example` `localhost:8080`, README manda ajustar "se a porta não for 5173" | `playwright.config.ts:61`; `tests/e2e/helpers/env.ts:5`; `.env.example:1`; `README.md` (seção Instalação) | Sem `.env.local`, páginas apontam para uma porta e o login/API para outra |
| Baixa | Seletores inline nos specs (fora do Page Object) | `e2e-feliz.spec.ts:32,49,52,61,64,83,98,114`; `e2e-negativo.spec.ts:23,25`; `smoke.spec.ts:15` | Mudança de texto/estrutura exige editar vários specs |
| Baixa | Asserção por classe CSS de utilitário | `e2e-feliz.spec.ts:81` (`/text-red-500/`) | Quebra ao trocar o tema/estilo sem mudar o comportamento |
| Baixa | Código morto: `pre-cr.setup.ts` e `preCrGlobalHooks.ts` não são referenciados por nenhum config (o único uso é um import entre os dois) | `tests/e2e/helpers/pre-cr/pre-cr.setup.ts:1-5`; `preCrGlobalHooks.ts`; `playwright.config.ts` (só tem o projeto `chromium` com `testMatch: '**/specs/**/*.spec.ts'`) | Confunde quem lê; duplica a lógica da fixture |
| Baixa | `PW_HEADLESS` é definida pelo pre-CR mas nunca lida | `scripts/pre-cr/run-pre-cr.mjs:119`; nenhuma leitura em `playwright.config.ts` | Falsa impressão de que dá para controlar headless por variável |
| Baixa | README desatualizado: diz "catálogo vazio", "quando houver specs" e "primeiro spec nasce na primeira tarefa" | `README.md` (seções "O que já existe" e "Comandos"); catálogo já tem o módulo `descricao-sugestao` | Onboarding confuso (o `GUIA.md` cobre, mas o README ainda precisa ser corrigido) |
| Baixa | Sem scripts `test:api` / `test:smoke` | `package.json` (seção `scripts`) | Para rodar só uma camada é preciso lembrar o caminho do arquivo |

> Nota sobre o login: `garantirSessao` é chamado no `beforeEach` de `smoke.spec.ts`, `e2e-feliz.spec.ts` e `e2e-negativo.spec.ts` — ou seja, todo teste de tela (10 dos 16 testes) faz login/`goto` pela UI. A contagem exata de logins reais depende de a sessão já existir no navegador (o método retorna cedo se o botão de nova sugestão já está visível); a confirmar em execução.

## 3. Sugestões priorizadas

### P0 — fazer já (risco baixo de quebra)

| Item | O quê | Por quê | Risco | Esforço |
|---|---|---|---|---|
| P0-1 | Corrigir o `.gitignore` de `evidencias-pr`: ignorar tudo (`evidencias-pr/**`), exceto `README.md` e, se de fato forem para a PR, `**/zips/*.zip`. Depois `git rm -r --cached` das runs, dos `corpo-pr*.md` e de `zips__2/` | Parar de versionar artefatos de execução | Baixo (só arquivos de saída) | P |
| P0-2 | Detectar spec de API pelo nome (`api.spec`) além do caminho em `ehSpecApi` | A camada de API volta a rodar no pre-CR, como declara o manifesto | Baixo, mas o script é compartilhado com Portal/Central: coordenar com o harness antes de editar um repo só | P |
| P0-3 | Unificar a porta padrão (escolher uma e usar em `playwright.config.ts`, `helpers/env.ts`, `.env.example` e README) | Remover a divergência 5173 × 8080 | Baixo | P |
| P0-4 | Atualizar o README (catálogo não está vazio, há specs, apontar para o `GUIA.md`) | Onboarding correto | Nenhum | P |

### P1 — próximo ciclo (risco médio)

| Item | O quê | Por quê | Risco | Esforço |
|---|---|---|---|---|
| P1-1 | Criar um projeto Playwright `setup` que faz o dev-login e grava `storageState`; os projetos de UI dependem dele | Elimina login repetido e deixa os testes mais rápidos e estáveis | Médio: mexe em `playwright.config.ts` e em `LoginPage` | M |
| P1-2 | Criar um projeto `api` sem `page`; mover/ajustar a fixture `_evidenciaPreCr` para só criar `page` quando o teste for de UI | API roda sem abrir navegador | Médio: o pre-CR depende da fixture | M |
| P1-3 | Limpar a massa pela API: no `afterAll` do E2E, apagar sugestões com prefixo `QA-E2E` (usando `deletarSugestaoApi`) | Evitar crescimento da massa | Baixo | P |
| P1-4 | Tornar os testes do `e2e-feliz` independentes: criar a sugestão por API na preparação (`beforeAll`) e deixar só o CT-E2E-01 criar pela UI | Remove o modo serial e permite rodar cada teste isolado | Médio: reescreve a ordem dos testes | M |
| P1-5 | Mover os seletores inline dos specs para os Page Objects | Manutenção em um lugar só | Baixo | P |
| P1-6 | Ler produto e pilar de variáveis (`E2E_PRODUTO`, `E2E_PILAR`) com o valor atual como padrão | Menos acoplamento à massa | Baixo | P |
| P1-7 | Adicionar scripts `test:api` e `test:smoke` em `package.json` | Rodar uma camada com um comando | Nenhum | P |
| P1-8 | Criar workflow de CI que rode `npm run test:release` (em ambiente efêmero com `mural-web`/`mural-api`) | Hoje nada roda sem pessoa; o `forbidOnly` e o retry do config só entram em ação com `CI` | Médio: exige subir o produto no pipeline | G |
| P1-9 | Apagar os helpers mortos (`pre-cr.setup.ts`, `preCrGlobalHooks.ts`) | Menos código para entender | Baixo (confirmar uso antes) | P |

### P2 — longo prazo

| Item | O quê | Por quê | Risco | Esforço |
|---|---|---|---|---|
| P2-1 | Contratos de `data-testid` num arquivo único (constantes) usado pelos Page Objects | Evita string solta e facilita ver o que o produto precisa manter | Baixo | M |
| P2-2 | Trocar a asserção de classe `text-red-500` por `data-testid`/atributo ARIA exposto pelo produto | Teste não quebra por mudança de estilo (exige PR mínimo no `mural-web` só com o atributo) | Médio: depende do time de produto | M |
| P2-3 | Pacote compartilhado de pre-CR (ver seção abaixo) | Parar de duplicar scripts entre repositórios | Médio-alto: migração em vários repos | G |
| P2-4 | Reduzir o acoplamento entre pre-CR e suíte (o pre-CR é maior que os testes) | Suíte mais simples de entender | Médio | G |

### Código compartilhado entre repositórios

Os repositórios de teste da CERTTUS duplicam scripts:

- `scripts/run-test-dev.mjs` é idêntico nos cinco repositórios que o possuem.
- `scripts/pre-cr/*` do Mural e do Portal são praticamente clones; o Central tem desvio moderado; Talk e Touch divergiram bastante.
- O desvio já causa defeito: no Central, a função que executa os specs faz `spawn` de `npx.cmd` com `shell: false` e não trata `result.error`, o que falha sem mensagem em Node 18.20/20.12 ou superior no Windows. O Mural já tem a correção (`scripts/pre-cr/lib/executar-specs.mjs:54-63`: usa `shell: lWindows` e trata `result.error`).

**Recomendação:** criar um pacote interno `@certtus/qa-pre-cr` com o núcleo (catálogo, resolver módulo, rodada, evidências, zip, corpo da PR) e **adaptadores por runner** (Playwright, Cypress, WebdriverIO). Ordem de migração sugerida:

1. Mural + Portal (já são quase iguais; menor risco).
2. Central (após alinhar o desvio).
3. Talk e Touch (maior divergência, por último).

O mesmo vale para o executor da bateria de release (`scripts/release/run-release.mjs`), hoje copiado em cada repo: ao virar pacote, uma correção chega a todos.

## 4. Estrutura de pastas alvo

A estrutura atual (`tests/e2e/{specs,pages,helpers}`) é adequada para o tamanho do repositório. Proposta de ajuste mínimo, só quando surgir o segundo módulo ou o projeto `api`:

```text
tests/
├── api/<modulo>/*.spec.ts        # projeto "api" (sem navegador)
├── e2e/
│   ├── setup/auth.setup.ts       # dev-login -> .auth/user.json
│   ├── specs/<modulo>/{smoke,e2e-feliz,e2e-negativo}.spec.ts
│   ├── pages/
│   └── contratos/testids.ts
├── helpers/                      # env, api, massa (compartilhado por api e e2e)
└── pre-cr/                       # helpers do pre-CR (hoje em tests/e2e/helpers/pre-cr)
```

| De | Para | Quando |
|---|---|---|
| `tests/e2e/specs/descricao-sugestao/api.spec.ts` | `tests/api/descricao-sugestao/api.spec.ts` | Junto com o projeto `api` (P1-2) e com o ajuste do `ehSpecApi` |
| `tests/e2e/helpers/api.ts`, `env.ts` | `tests/helpers/` | Junto com a mudança acima |
| `tests/e2e/helpers/pre-cr/` | `tests/pre-cr/` | Opcional, junto do pacote compartilhado |
| (novo) | `tests/e2e/setup/auth.setup.ts` | P1-1 |

Atenção: mover o `api.spec.ts` exige atualizar `scripts/pre-cr/catalogo-modulos.json`, o `testMatch` do config e a geração de fases em `release.config.mjs` (hoje varre `tests/e2e/specs/*/`).

## 5. Padrões de escrita propostos

- **Arquivos:** `tests/e2e/specs/<slug-do-modulo>/{api,smoke,e2e-feliz,e2e-negativo}.spec.ts` (já é o padrão; manter, pois o pre-CR e a bateria dependem dos nomes). Organização **por funcionalidade**, não por ticket: o ticket (IN-884) fica no título do `describe`, não no nome da pasta. A pasta atual `descricao-sugestao` está correta.
- **Títulos:** `CT-<TIPO>-NN — descrição` (já em uso: `CT-API-`, `CT-SMK-`, `CT-E2E-`). Numeração contínua por tipo **no repositório**, não reiniciando por módulo (hoje E2E negativo segue o feliz: 07 e 08). Ao criar módulo novo, considerar o prefixo `CT-<MODULO>-<TIPO>-NN` para evitar colisão.
- **Idioma:** pt-BR, com acentuação, em títulos, comentários e mensagens de erro.
- **Nomes de variáveis:** prefixos húngaros já usados (`c`, `n`, `m`, `o`, `l`); manter.
- **Tags:** hoje não há. Sugestão: `@smoke`, `@api`, `@e2e` no título do `describe` para filtrar com `--grep`, permitindo `test:smoke` sem depender de caminho.
- **Seletores:** só em Page Object; `data-testid` primeiro, `aria-label` depois, `role` por último. Nunca classe de estilo.
- **Dados:** prefixo `QA-API` / `QA-E2E` + `Date.now()`; sempre apagar pela API no `afterAll`.
- **Um teste = um comportamento.** Preferir testes independentes; usar `serial` só com justificativa escrita.

## 6. Velocidade e estabilidade

| Causa | Efeito | Como resolver |
|---|---|---|
| Login pela UI repetido por teste | Segundos a mais por teste e mais pontos de falha | `setup` com `storageState` (P1-1) |
| Fixture automática que exige `page` para todo teste | API abre navegador à toa | Projeto `api` e fixture condicional (P1-2) |
| `e2e-feliz` serial e encadeado | Uma falha derruba 4 testes; sem execução isolada | Preparar a massa por API (P1-4) |
| Massa criada e nunca removida | Listagem cresce; busca por título fica mais lenta e sujeita a colisão | Limpeza no `afterAll` (P1-3) |
| `fullyParallel` com `workers` indefinido localmente | Concorrência sobre a mesma massa | Bateria usa `--workers=1`; avaliar fixar `workers` por projeto |
| `retries: 0` fora de CI | Flake local derruba a rodada (com `maxFailures: 1`, derruba tudo) | Considerar `retries: 1` na bateria de release, mantendo o relatório do que foi repetido |
| `maxFailures: 1` por padrão | Bom para a bateria (stop-on-fail), ruim para diagnóstico | Documentado: `PW_MAX_FAILURES=0` roda tudo |
| Modo pre-CR (slowMo 400, vídeo ligado) | Lento de propósito | Nunca usar na bateria (a release força `PRE_CR=0`) |
| Esperas | Não há `waitForTimeout`; as esperas são por `expect`/`waitFor` | Manter; evitar timeouts longos fixos de 20 s espalhados nos specs (centralizar no Page Object) |
