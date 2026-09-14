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

**PR produto relacionada:** *(preencher mural-api / mural-web após merge)*

---

### 🛠️ O que entrou nesta PR (automação)

- Suite Playwright `descricao-sugestao` (API, smoke, E2E feliz/negativo)
- Fixture de evidências pre-cr sem project setup
- Nomenclatura legível em `evidencias-pr/IN-884/IN-891/`
- **Pacote zip de evidências versionado nesta PR** (ver aba Files changed)

---

### ▶️ Execução

Validado localmente: **16 testes passando** com `test:pre-cr`.

```bash
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
npm run pre-cr:empacotar -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
```

---

### 📋 CTs (API + Smoke + E2E)

| Trilha | Qtd | Status |
|--------|-----|--------|
| API (CT-API-01 … 06) | 6 | ✓ |
| Smoke (CT-SMK-01 … 02) | 2 | ✓ |
| E2E feliz/negativo | 8 | ✓ |

---

### 📎 Evidências versionadas nesta PR

| Artefato | Caminho |
|----------|---------|
| Cenários | `docs/tests/descricao-sugestao/cenarios.md` |
| Plano execução | `docs/tests/descricao-sugestao/resumo-implementacao.md` |
| **Pacote zip** | [`harness-qa-pre-cr-IN-891-2026-09-14_15-01-40.zip`](https://github.com/CERTTUS/testes-automatizados-Mural/raw/feat/IN-891-descricao-sugestao/evidencias-pr/IN-884/IN-891/zips/harness-qa-pre-cr-IN-891-2026-09-14_15-01-40.zip) |

O zip contém docs do módulo, `manifest.json` e artefatos da última run (HTML report, traces, `resultado-execucao-dev.md`).

---

### 📝 Checklist

- [x] Veredito coerente com a execução local
- [x] Zip de evidências anexado na PR
- [ ] Link PR produto na seção Contexto
- [ ] Reviewer = Auditor do pai Jira

---

### 🔗 Relacionado

- Jira Dev: https://certtus-team.atlassian.net/browse/IN-891
- Jira pai: https://certtus-team.atlassian.net/browse/IN-884

<!-- HARNESS_QA_PRE_CR:IN-891 -->
Veredito: PASSOU | Módulo: descricao-sugestao | PR testes: #1
<!-- HARNESS_QA_PRE_CR_END:IN-891 -->
