import {test as base, expect} from '@playwright/test';
import {evidenciarSmokePreCr} from './helpers/pre-cr/evidenciarSmokePreCr';
import {extrairCtIdDoTitulo} from './helpers/pre-cr/extrairCtIdDoTitulo';

function jaTemEvidenciaCt(
   testInfo: import('@playwright/test').TestInfo,
   ctId: string,
): boolean {
   const prefixo = ctId.toUpperCase();
   return testInfo.attachments.some((anexo) => anexo.name?.toUpperCase().includes(prefixo));
}

const test = base.extend({
   _evidenciaPreCr: [
      async ({page}, use, testInfo) => {
         await use();
         if (process.env.PRE_CR !== '1') {
            return;
         }
         if (testInfo.status !== testInfo.expectedStatus) {
            return;
         }
         const ctId = extrairCtIdDoTitulo(testInfo.title);
         if (!ctId || jaTemEvidenciaCt(testInfo, ctId) || !page) {
            return;
         }
         await evidenciarSmokePreCr(page, testInfo, ctId, testInfo.title);
      },
      {auto: true},
   ],
});

export {test, expect};
