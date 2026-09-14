import {expect, test} from '@playwright/test';
import '../../helpers/pre-cr/preCrGlobalHooks';
import {LoginPage} from '../../pages/LoginPage';
import {MuralPage} from '../../pages/MuralPage';
import {FormularioSugestaoPage} from '../../pages/FormularioSugestaoPage';

test.describe('Smoke — descrição da sugestão (IN-884)', () => {
   test.beforeEach(async ({page}) => {
      await new LoginPage(page).garantirSessao();
   });

   test('CT-SMK-01 — Abrir o mural autenticado e ver a listagem', async ({page}) => {
      const oMural = new MuralPage(page);
      await expect(page.getByRole('heading', {name: 'Mural de Sugestões'})).toBeVisible();
      await expect(oMural.listagem()).toBeVisible();
      await expect(oMural.listagem().getByTestId('suggestion-card').first()).toBeVisible();
   });

   test('CT-SMK-02 — Abrir nova sugestão e ver o contador 0/2000', async ({page}) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      await oMural.abrirNovaSugestao();
      await oForm.aguardarAberto('Nova sugestão');
      await expect(oForm.contador()).toHaveText('0/2000');
   });
});
