# evidencias-pr

Artefatos locais do hop Dev (QA_PRE_CR). Gitignored, exceto este README.

## Layout

```text
evidencias-pr/
  <parentKey>/                 # História (ex.: IN-884)
    <devKey>/                  # Tarefa de teste/Dev (ex.: IN-891)
      runs/
        <YYYY-MM-DD_HH-mm-ss>-<modulo>/   # ex.: 2026-09-14_15-09-11-descricao-sugestao
          meta.md
          resultado-execucao-dev.md
          evidencias/
      zips/
        harness-qa-pre-cr-<devKey>-<YYYY-MM-DD_HH-mm-ss>.zip
```

Iniciar pastas no começo do ciclo:

```bash
npm run pre-cr:iniciar-rodada -- --parent-key IN-884 --dev-key IN-891 --modulo descricao-sugestao
```
