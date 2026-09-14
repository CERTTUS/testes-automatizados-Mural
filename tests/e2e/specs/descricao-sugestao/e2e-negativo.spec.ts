import {expect, test} from '../../fixtures';
import '../../helpers/pre-cr/preCrGlobalHooks';
import {N_DESCRICAO_SUGESTAO_MAX} from '../../helpers/env';
import {LoginPage} from '../../pages/LoginPage';
import {MuralPage} from '../../pages/MuralPage';
import {FormularioSugestaoPage} from '../../pages/FormularioSugestaoPage';

test.describe('E2E negativo — descrição (IN-884)', () => {
   test.beforeEach(async ({page}) => {
      await new LoginPage(page).garantirSessao();
   });

   test('CT-E2E-07 — Recusar envio com descrição em branco', async ({page}) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      const cTitulo = `QA-E2E-vazia ${Date.now()}`;
      await oMural.abrirNovaSugestao();
      await oForm.aguardarAberto('Nova sugestão');
      await oForm.preencherTitulo(cTitulo);
      await oForm.selecionarOpcao('produto', 'Sistema Certtus');
      await oForm.selecionarOpcao('pilarGestao', 'Produtividade');
      await oForm.preencherDescricao('   ');
      await oForm.enviar();
      await expect(page.getByText('Preencha todos os campos obrigatórios.')).toBeVisible();
      await expect(oForm.formulario()).toBeVisible();
      await page.getByRole('button', {name: 'Fechar modal'}).click();
      await expect(oMural.cardListagemPorTitulo(cTitulo)).toHaveCount(0);
   });

   test('CT-E2E-08 — Impedir o 2001º caractere no campo descrição', async ({page}) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      await oMural.abrirNovaSugestao();
      await oForm.aguardarAberto('Nova sugestão');
      await oForm.tentarInserirAlemDoTeto();
      await expect(oForm.textareaDescricao()).toHaveValue('L'.repeat(N_DESCRICAO_SUGESTAO_MAX));
      await expect(oForm.contador()).toHaveText('2000/2000');
   });
});
