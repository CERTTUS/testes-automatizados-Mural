import fs from 'node:fs';
import path from 'node:path';
import type {TestInfo} from '@playwright/test';

/** Pasta plana: PRE_CR_RUN_DIR/evidencias/ (sem subpastas por tipo). */
export function pastaEvidenciasRun(): string | null {
   if (process.env.PRE_CR !== '1') {
      return null;
   }
   const runDir = process.env.PRE_CR_RUN_DIR;
   if (!runDir) {
      return null;
   }
   const dir = path.join(runDir, 'evidencias');
   fs.mkdirSync(dir, {recursive: true});
   return dir;
}

/** Grava prova em evidencias/<arquivo> */
export function gravarArquivoEvidenciaPreCr(
   nomeArquivo: string,
   conteudo: Buffer | string,
): string | null {
   const dir = pastaEvidenciasRun();
   if (!dir) {
      return null;
   }
   const dest = path.join(dir, nomeArquivo);
   fs.writeFileSync(dest, conteudo);
   return dest;
}

/** Registra CT → artefatos para o coletor mapear vídeo após a suíte. */
export function registrarCtManifest(
   ctId: string,
   artefatos: {
      screenshot?: string | null;
      api?: string | null;
      video?: string | null;
      outputDir?: string | null;
   },
): void {
   const dir = pastaEvidenciasRun();
   if (!dir) {
      return;
   }
   const manifestPath = path.join(dir, 'manifest-cts.jsonl');
   const linha = JSON.stringify({
      ctId,
      ...artefatos,
      em: new Date().toISOString(),
   });
   fs.appendFileSync(manifestPath, `${linha}\n`, 'utf8');
}

export function caminhoRelativoRun(caminhoAbsoluto: string | null): string | null {
   const runDir = process.env.PRE_CR_RUN_DIR;
   if (!runDir || !caminhoAbsoluto) {
      return null;
   }
   return path.relative(runDir, caminhoAbsoluto).replace(/\\/g, '/');
}

/** Caminho da pasta do teste em test-results/ (relativo à raiz do repo). */
export function outputDirRelativo(testInfo: TestInfo): string | null {
   return path.relative(process.cwd(), testInfo.outputDir).replace(/\\/g, '/');
}
