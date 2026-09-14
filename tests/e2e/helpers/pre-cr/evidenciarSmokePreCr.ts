import type {Page, TestInfo} from '@playwright/test';

/**
 * Evidência obrigatória no PASS — hop Dev QA_PRE_CR (PRE_CR=1).
 * Print da tela no assert final do CT smoke.
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

   testInfo.annotations.push({
      type: 'evidencia-pass',
      description: `${ctId}: ${descricao}`,
   });
}
