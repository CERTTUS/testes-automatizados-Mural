import type {TestInfo} from '@playwright/test';

function corpoJson(cTexto: string): unknown {
   try {
      return JSON.parse(cTexto);
   } catch {
      return cTexto;
   }
}

/**
 * Evidência obrigatória no PASS — hop Dev QA_PRE_CR (PRE_CR=1).
 * Anexa status + corpo da resposta HTTP para coleta em evidencias/api/.
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

   const oPayload = {
      status: nStatus,
      url: cUrl,
      body: corpoJson(cCorpo),
   };

   await testInfo.attach(`${ctId}-response.json`, {
      body: JSON.stringify(oPayload, null, 2),
      contentType: 'application/json',
   });

   testInfo.annotations.push({
      type: 'evidencia-pass',
      description: `${ctId}: HTTP ${nStatus}`,
   });
}
