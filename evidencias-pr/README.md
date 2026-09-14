# evidencias-pr

Artefatos locais do hop Dev (QA_PRE_CR). Gitignored, exceto este README e zips versionados na PR.

## Layout

```text
evidencias-pr/
  <parentKey>/                 # História (ex.: IN-884)
    <devKey>/                  # Tarefa Dev (ex.: IN-891) — sem prefixo "dev-"
      runs/
        <YYYY-MM-DD_HH-mm-ss>-<modulo>/    # ex.: 2026-09-14_15-09-11-descricao-sugestao
          meta.md
          resultado-execucao-dev.md
          evidencias/
            screenshots/       # CT-SMK-01-tela-final.png, CT-E2E-01-tela-final.png
            api/                 # CT-API-01-response.json
            videos/              # CT-SMK-01-gravacao.webm
            traces/              # CT-SMK-01-trace.zip
            html-report/
            manifest-cts.jsonl
      zips/
        harness-qa-pre-cr-<devKey>-<YYYY-MM-DD_HH-mm-ss>.zip
```

## Comandos

```bash
# Início do ciclo (cria pastas docs + evidencias-pr)
npm run pre-cr:iniciar-rodada -- --parent-key IN-884 --dev-key IN-891 --modulo descricao-sugestao

# Execução + coleta automática de prints/vídeos/traces
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884

# Empacotar zip (exige evidências por CT no PASS)
npm run pre-cr:empacotar -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
```

O zip gerado por `pre-cr:empacotar` pode entrar no commit da PR (link no corpo gerado por `pre-cr:corpo-pr`).
