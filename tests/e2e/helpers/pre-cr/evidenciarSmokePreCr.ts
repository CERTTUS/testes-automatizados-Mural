import type {Page, TestInfo} from '@playwright/test';
import {
   caminhoRelativoRun,
   gravarArquivoEvidenciaPreCr,
   outputDirRelativo,
   registrarCtManifest,
} from './gravarEvidenciaPreCr';

/**
 * Evidência obrigatória no PASS — hop Dev QA_PRE_CR (PRE_CR=1).
 * Print da tela + gravação (quando disponível) em evidencias-pr.
 */
export async function evidenciarSmokePreCr(
   page: Page,
   testInfo: TestInfo,
   ctId: string,
   descricao: string,
): Promise<void> {
   if (process.env.PRE_CR !== '1') {
      return;
   }

   const nomeArquivo = `${ctId}-tela-final.png`;
   const png = await page.screenshot({fullPage: false});

   await testInfo.attach(nomeArquivo, {
      body: png,
      contentType: 'image/png',
   });

   const caminhoPrint = gravarArquivoEvidenciaPreCr(nomeArquivo, png);

   registrarCtManifest(ctId, {
      screenshot: caminhoRelativoRun(caminhoPrint),
      outputDir: outputDirRelativo(testInfo),
   });

   testInfo.annotations.push({
      type: 'evidencia-pass',
      description: `${ctId}: ${descricao}`,
   });
}
