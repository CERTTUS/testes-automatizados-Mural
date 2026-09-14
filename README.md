# CERTTUS Mural de Sugestões — Testes Automatizados

Suíte **Playwright + TypeScript** do Mural. Base para o hop Dev (`QA_PRE_CR`): o primeiro spec de produto nasce na primeira tarefa (bootstrap do catálogo).

Repositórios de produto: `mural-web` / `mural-api`.

## O que já existe

| Peça | Função |
|------|--------|
| `scripts/pre-cr/` | Resolver slug, bootstrap, executar pontual, empacotar zip, corpo da PR |
| `tests/e2e/helpers/pre-cr/` | Screenshot no PASS quando `PRE_CR=1` |
| Catálogo | `scripts/pre-cr/catalogo-modulos.json` — vazio até a 1ª Dev |

**Não** rode a suíte inteira no hop Dev. MeloQA fica na WU Teste.

## Instalação

```bash
npm install
npx playwright install chromium
npx playwright install chrome
copy .env.example .env.local
```

Suba o `mural-web` e ajuste `E2E_BASE_URL` se a porta não for `5173`.

## Comandos

| Script | Uso |
|--------|-----|
| `npm run pre-cr:modulos` | Lista módulos (vazio até o bootstrap) |
| `npm run test:pre-cr -- --modulo <slug> --dev-key <DEV> --parent-key <HU>` | Hop Dev |
| `npm run pre-cr:bootstrap -- --from-diff --parent-key <HU> --dev-key <DEV>` | Cria slug quando o diff não casa |
| `npm run test:e2e` | E2E (quando houver specs) |

## Estrutura

```text
tests/e2e/specs/     # specs por área (criados no hop Dev)
tests/e2e/pages/     # Page Objects
tests/e2e/helpers/pre-cr/
scripts/pre-cr/
docs/tests/          # local (gitignored), exceto README
evidencias-pr/       # local (gitignored)
```

Seletores: `data-testid` → `aria-label` → `role`. No `mural-web`, QA só adiciona `data-testid`.
