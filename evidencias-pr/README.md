# evidencias-pr

Artefatos locais do hop Dev (QA_PRE_CR). Gitignored, exceto README e zips versionados na PR.

## Layout (simples)

```text
evidencias-pr/
  IN-884/                      # História (parentKey)
    IN-891/                    # Tarefa Dev (devKey)
      runs/
        atual/                 # ← única execução ativa (sempre reutilizada)
          meta.md
          resultado-execucao-dev.md
          evidencias/
            CT-SMK-01-tela-final.png
            CT-API-01-response.json
            CT-SMK-01-gravacao.webm
            manifest-cts.jsonl
        historico/             # snapshots curtos (opcional, após organizar)
          2026-09-14_15-01/
      zips/
        harness-qa-pre-cr-IN-891-2026-09-14_15-01.zip
```

**Por que `atual`?** Cada `test:pre-cr` limpa e reutiliza a mesma pasta — evita acumular dezenas de runs com nomes longos.

## Comandos

```bash
npm run pre-cr:iniciar-rodada -- --parent-key IN-884 --dev-key IN-891 --modulo descricao-sugestao
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
npm run pre-cr:empacotar -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884

# Arquivar runs antigas (20260914-* / nomes longos) → historico/2026-09-14_15-01
npm run pre-cr:renomear-runs
```
