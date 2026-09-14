import fs from 'node:fs';
import path from 'node:path';
import type {Page, TestInfo} from '@playwright/test';

export type TipoEvidenciaPreCr = 'screenshots' | 'api' | 'videos' | 'traces';

/** Pasta de evidência dentro de PRE_CR_RUN_DIR/evidencias/<tipo>. */
export function pastaEvidenciaPreCr(tipo: TipoEvidenciaPreCr): string | null {
   if (process.env.PRE_CR !== '1') {
      return null;
   }
   const runDir = process.env.PRE_CR_RUN_DIR;
   if (!runDir) {
      return null;
   }
   const dir = path.join(runDir, 'evidencias', tipo);
   fs.mkdirSync(dir, {recursive: true});
   return dir;
}

/** Grava arquivo em evidencias/<tipo>/ e retorna caminho absoluto. */
export function gravarArquivoEvidenciaPreCr(
   tipo: Exclude<TipoEvidenciaPreCr, 'traces'>,
   nomeArquivo: string,
   conteudo: Buffer | string,
): string | null {
   const dir = pastaEvidenciaPreCr(tipo);
   if (!dir) {
      return null;
   }
   const dest = path.join(dir, nomeArquivo);
   fs.writeFileSync(dest, conteudo);
   return dest;
}

/** Registra CT → artefatos para o coletor mapear vídeo/trace após a suíte. */
export function registrarCtManifest(
   ctId: string,
   artefatos: {
      screenshot?: string | null;
      api?: string | null;
      outputDir?: string | null;
   },
): void {
   const dir = pastaEvidenciaPreCr('screenshots');
   if (!dir) {
      return;
   }
   const manifestPath = path.join(path.dirname(dir), 'manifest-cts.jsonl');
   const linha = JSON.stringify({
      ctId,
      ...artefatos,
      em: new Date().toISOString(),
   });
   fs.appendFileSync(manifestPath, `${linha}\n`, 'utf8');
}

/** Tenta salvar gravação de tela; se falhar, o coletor pós-run copia de test-results. */
export async function gravarVideoPreCr(page: Page, ctId: string): Promise<string | null> {
   if (process.env.PRE_CR !== '1') {
      return null;
   }
   const dir = pastaEvidenciaPreCr('videos');
   if (!dir) {
      return null;
   }
   const video = page.video();
   if (!video) {
      return null;
   }
   const dest = path.join(dir, `${ctId}-gravacao.webm`);
   try {
      await video.saveAs(dest);
      return dest;
   } catch {
      return null;
   }
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
