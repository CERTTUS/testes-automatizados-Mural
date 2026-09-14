# evidencias-pr

Artefatos locais do hop Dev (QA_PRE_CR). Gitignored, exceto README e zips versionados na PR.

## Layout — uma pasta, arquivos por tipo no nome

```text
evidencias-pr/
  IN-884/
    IN-891/
      runs/
        atual/                         # única execução ativa
          meta.md
          resultado-execucao-dev.md
          plano-execucao.json
          manifest-cts.jsonl
          CT-SMK-01-tela-final.png     # foto
          CT-SMK-01-gravacao.webm       # vídeo
          CT-API-01-response.json        # teste API
          CT-E2E-01-tela-final.png     # E2E
        historico/
          2026-09-14_15-01/            # snapshot (mesma estrutura plana)
      zips/
```

Sem subpastas `screenshots/`, `api/`, `videos/`, `html-report/` — tudo na mesma pasta, diferenciado pelo nome do arquivo.

## Comandos

```bash
npm run test:pre-cr -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
npm run pre-cr:empacotar -- --modulo descricao-sugestao --dev-key IN-891 --parent-key IN-884
npm run pre-cr:renomear-runs    # unifica histórico legado
```
