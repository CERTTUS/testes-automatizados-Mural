import {test} from '@playwright/test';
import {evidenciarSmokePreCr} from './evidenciarSmokePreCr';
import {extrairCtIdDoTitulo} from './extrairCtIdDoTitulo';

function jaTemEvidenciaCt(testInfo: import('@playwright/test').TestInfo, ctId: string): boolean {
   const prefixo = ctId.toUpperCase();
   return testInfo.attachments.some((anexo) => anexo.name?.toUpperCase().includes(prefixo));
}

test.afterEach(async ({page}, testInfo) => {
   if (process.env.PRE_CR !== '1') {
      return;
   }
   if (testInfo.status !== testInfo.expectedStatus) {
      return;
   }

   const ctId = extrairCtIdDoTitulo(testInfo.title);
   if (!ctId || jaTemEvidenciaCt(testInfo, ctId)) {
      return;
   }

   if (page) {
      await evidenciarSmokePreCr(page, testInfo, ctId, testInfo.title);
   }
});
