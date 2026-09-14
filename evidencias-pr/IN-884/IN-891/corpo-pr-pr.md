## 🧪 QA_PRE_CR — IN-884: descricao-sugestao

| Campo | Valor |
|-------|--------|
| **devKey** | IN-891 |
| **parentKey** | IN-884 |
| **Produto** | mural |
| **Módulo** | `descricao-sugestao` |
| **Veredito** | **PASSOU** |
| **Ambiente** | local |
| **Data execução** | 2026-09-14 |
| **Comando** | `npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884` |

---

### 📚 Contexto

Automação QA_PRE_CR do hop Dev — cobertura do módulo **Descrição sugestão** vinculada a `IN-884`.

Esta PR valida o fluxo de entrega (commit → push → PR) com a suite IN-891 já aprovada localmente (16/16).

**PR produto relacionada:** *(preencher mural-api / mural-web após merge)*

---

### 🛠️ O que entrou nesta PR (automação)

- Suite Playwright `descricao-sugestao` (API, smoke, E2E feliz/negativo)
- Fixture `tests/e2e/fixtures.ts` para evidências pre-cr sem project setup
- Evidência de API (`evidenciarApiPreCr.ts`) e extração de CT no título
- Correção `spawnSync` no Windows (`shell: true`)
- **Nomenclatura legível** em `evidencias-pr/`:
  - `IN-884/IN-891/` (sem prefixo `dev-`)
  - runs: `2026-09-14_15-01-03-descricao-sugestao` (data + módulo)

---

### ▶️ Execução

Validado localmente antes do push: **16 testes passando** com `test:pre-cr`.

**Comando canônico:**

```bash
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
```

---

### 📋 CTs (API + Smoke + E2E)

| Trilha | Qtd | Status |
|--------|-----|--------|
| API (CT-API-01 … 06) | 6 | ✓ |
| Smoke (CT-SMK-01 … 02) | 2 | ✓ |
| E2E feliz/negativo | 8 | ✓ |

**Seção 5 — Manual:** checklist em `docs/tests/descricao-sugestao/cenarios.md` (não bloqueia veredito).

---

### 📎 Evidências

| Artefato | Caminho |
|----------|---------|
| Cenários | `docs/tests/descricao-sugestao/cenarios.md` |
| Plano | `docs/tests/descricao-sugestao/resumo-implementacao.md` |
| Layout evidências | `evidencias-pr/README.md` |

---

### 📝 Checklist

- [x] Veredito coerente com a execução local
- [x] Suite IN-891 implementada
- [ ] Link PR produto na seção Contexto
- [ ] Reviewer = Auditor do pai Jira

---

### 🔗 Relacionado

- Jira Dev: https://certtus-team.atlassian.net/browse/IN-891
- Jira pai: https://certtus-team.atlassian.net/browse/IN-884

<!-- HARNESS_QA_PRE_CR:IN-891 -->
Veredito: PASSOU | Módulo: descricao-sugestao | PR testes: #___
<!-- HARNESS_QA_PRE_CR_END:IN-891 -->
