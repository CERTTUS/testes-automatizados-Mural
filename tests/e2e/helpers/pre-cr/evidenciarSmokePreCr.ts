import type {Page, TestInfo} from '@playwright/test';
import {evidenciarVideoPontual} from './evidenciaVideoPreCr';
import {
   caminhoRelativoRun,
   gravarArquivoEvidenciaPreCr,
   outputDirRelativo,
   registrarCtManifest,
} from './gravarEvidenciaPreCr';

const HOLD_PADRAO_MS = 6_000;
const HOLD_MIN_MS = 4_000;
const HOLD_MAX_MS = 20_000;

function duracaoHoldVideoPreCr(): number {
   const bruto = Number(process.env.PRE_CR_VIDEO_HOLD_MS ?? HOLD_PADRAO_MS);
   const valor = Number.isFinite(bruto) ? bruto : HOLD_PADRAO_MS;
   return Math.min(HOLD_MAX_MS, Math.max(HOLD_MIN_MS, valor));
}

/**
 * O screencast do Chromium só emite quadro quando a tela muda — o .webm vira
 * um time-lapse curto. Força rAF por alguns segundos para o vídeo ficar em tempo real.
 */
export async function segurarTelaParaVideoPreCr(page: Page): Promise<void> {
   if (process.env.PRE_CR !== '1' || page.isClosed()) {
      return;
   }
   const duracaoMs = duracaoHoldVideoPreCr();
   await page.evaluate(async (ms) => {
      const id = '__harness_precr_video_tick';
      let el = document.getElementById(id);
      if (!el) {
         el = document.createElement('div');
         el.id = id;
         el.setAttribute('aria-hidden', 'true');
         el.style.cssText =
            'position:fixed;right:8px;bottom:8px;z-index:2147483647;pointer-events:none;' +
            'font:12px/1.2 ui-monospace,monospace;color:rgba(255,255,255,0.9);' +
            'background:rgba(0,0,0,0.4);padding:4px 8px;border-radius:4px';
         document.body.appendChild(el);
      }
      const marcador = el;
      const inicio = performance.now();
      await new Promise<void>((resolve) => {
         const tick = () => {
            const elapsed = performance.now() - inicio;
            marcador.textContent = `gravação ${(elapsed / 1000).toFixed(1)}s`;
            if (elapsed >= ms) {
               resolve();
               return;
            }
            requestAnimationFrame(tick);
         };
         tick();
      });
      marcador.remove();
   }, duracaoMs);
}

/**
 * Evidência obrigatória no PASS — hop Dev QA_PRE_CR (PRE_CR=1).
 * Print da tela + hold da gravação (quando disponível) em evidencias-pr.
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

   await evidenciarVideoPontual(page, testInfo, ctId, 'tela-final');
   await segurarTelaParaVideoPreCr(page);
}
