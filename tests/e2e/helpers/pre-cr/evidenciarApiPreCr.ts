import type {TestInfo} from '@playwright/test';
import {caminhoRelativoRun, gravarArquivoEvidenciaPreCr, registrarCtManifest} from './gravarEvidenciaPreCr';

function corpoJson(cTexto: string): unknown {
   try {
      return JSON.parse(cTexto);
   } catch {
      return cTexto;
   }
}

/**
 * Evidência obrigatória no PASS — hop Dev QA_PRE_CR (PRE_CR=1).
 * Grava JSON em evidencias/ e anexa no relatório Playwright.
 */
export async function evidenciarApiPreCr(
   testInfo: TestInfo,
   ctId: string,
   nStatus: number,
   cUrl: string,
   cCorpo: string,
): Promise<void> {
   if (process.env.PRE_CR !== '1') {
      return;
   }

   const nomeArquivo = `${ctId}-response.json`;
   const oPayload = {
      status: nStatus,
      url: cUrl,
      body: corpoJson(cCorpo),
   };
   const cJson = JSON.stringify(oPayload, null, 2);

   await testInfo.attach(nomeArquivo, {
      body: cJson,
      contentType: 'application/json',
   });

   const caminhoApi = gravarArquivoEvidenciaPreCr(nomeArquivo, cJson);
   registrarCtManifest(ctId, {api: caminhoRelativoRun(caminhoApi)});

   testInfo.annotations.push({
      type: 'evidencia-pass',
      description: `${ctId}: HTTP ${nStatus}`,
   });
}
