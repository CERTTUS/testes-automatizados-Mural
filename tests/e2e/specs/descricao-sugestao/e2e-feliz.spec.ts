import {expect, test} from '@playwright/test';
import '../../helpers/pre-cr/preCrGlobalHooks';
import {N_DESCRICAO_SUGESTAO_MAX} from '../../helpers/env';
import {LoginPage} from '../../pages/LoginPage';
import {MuralPage} from '../../pages/MuralPage';
import {FormularioSugestaoPage} from '../../pages/FormularioSugestaoPage';

const C_PRODUTO = 'Sistema Certtus';
const C_PILAR = 'Produtividade';

test.describe('E2E feliz — descrição expandível (IN-884)', () => {
   test.describe.configure({mode: 'serial'});

   const cTituloLonga = `QA-E2E-longa ${Date.now()}`;
   const cTituloCurta = `QA-E2E-curta ${Date.now()}`;
   const cDescricaoLonga = `${'Linha longa da descrição IN-884. '.repeat(60)}`.slice(0, 1800);

   test.beforeEach(async ({page}) => {
      await new LoginPage(page).garantirSessao();
   });

   test('CT-E2E-01 — Criar sugestão longa e ver Ver mais no card', async ({page}) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      await oMural.abrirNovaSugestao();
      await oForm.aguardarAberto('Nova sugestão');
      await oForm.preencherTitulo(cTituloLonga);
      await oForm.selecionarOpcao('produto', C_PRODUTO);
      await oForm.selecionarOpcao('pilarGestao', C_PILAR);
      await oForm.preencherDescricao(cDescricaoLonga);
      await expect(oForm.contador()).toHaveText(`${cDescricaoLonga.length}/2000`);
      await oForm.enviar();
      await expect(page.getByText('Sugestão criada com sucesso!')).toBeVisible({
         timeout: 20_000,
      });
      await oMural.esperarCardListagem(cTituloLonga);
      await expect(
         oMural.cardListagemPorTitulo(cTituloLonga).getByTestId('btn-descricao-toggle'),
      ).toHaveText('Ver mais');
   });

   test('CT-E2E-02 — Expandir e recolher a descrição no card sem abrir detalhes', async ({
      page,
   }) => {
      const oMural = new MuralPage(page);
      await oMural.esperarCardListagem(cTituloLonga);
      const oCard = oMural.cardListagemPorTitulo(cTituloLonga);
      await oCard.getByTestId('btn-descricao-toggle').click();
      await expect(oCard.getByTestId('btn-descricao-toggle')).toHaveText('Ver menos');
      await expect(page.getByTestId('dialog-detalhes-sugestao')).toHaveCount(0);
      await oCard.getByTestId('btn-descricao-toggle').click();
      await expect(oCard.getByTestId('btn-descricao-toggle')).toHaveText('Ver mais');
      await expect(page.getByTestId('dialog-detalhes-sugestao')).toHaveCount(0);
   });

   test('CT-E2E-03 — Abrir detalhes pelo clique no card e ver o texto completo', async ({
      page,
   }) => {
      const oMural = new MuralPage(page);
      await oMural.esperarCardListagem(cTituloLonga);
      await oMural.abrirDetalhesPeloCard(cTituloLonga);
      await expect(page.getByTestId('dialog-descricao-completa')).toContainText(
         cDescricaoLonga.slice(0, 80),
      );
      const cTexto = await page.getByTestId('dialog-descricao-completa').innerText();
      expect(cTexto.replace(/\s+/g, ' ').length).toBeGreaterThan(200);
   });

   test('CT-E2E-04 — Editar descrição até 2000 com contador vermelho e salvar', async ({
      page,
   }) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      await oMural.esperarCardListagem(cTituloLonga);
      await oMural.abrirEdicaoPeloCard(cTituloLonga);
      await oForm.aguardarAberto('Editar sugestão');
      await oForm.selecionarOpcao('produto', C_PRODUTO);
      await oForm.selecionarOpcao('pilarGestao', C_PILAR);
      const cTeto = 'T'.repeat(N_DESCRICAO_SUGESTAO_MAX);
      await oForm.preencherDescricao(cTeto);
      await expect(oForm.contador()).toHaveText('2000/2000');
      await expect(oForm.contador()).toHaveClass(/text-red-500/);
      await oForm.salvar();
      await expect(page.getByText('Sugestão atualizada com sucesso!')).toBeVisible({
         timeout: 20_000,
      });
   });

   test('CT-E2E-05 — Descrição curta sem botão Ver mais', async ({page}) => {
      const oMural = new MuralPage(page);
      const oForm = new FormularioSugestaoPage(page);
      await oMural.abrirNovaSugestao();
      await oForm.aguardarAberto('Nova sugestão');
      await oForm.preencherTitulo(cTituloCurta);
      await oForm.selecionarOpcao('produto', C_PRODUTO);
      await oForm.selecionarOpcao('pilarGestao', C_PILAR);
      await oForm.preencherDescricao('Descrição curta.');
      await oForm.enviar();
      await expect(page.getByText('Sugestão criada com sucesso!')).toBeVisible({
         timeout: 20_000,
      });
      await oMural.esperarCardListagem(cTituloCurta);
      await expect(
         oMural.cardListagemPorTitulo(cTituloCurta).getByTestId('btn-descricao-toggle'),
      ).toHaveCount(0);
   });

   test('CT-E2E-06 — Ver mais no carrossel Minhas Sugestões', async ({page}) => {
      const oMural = new MuralPage(page);
      const oCard = oMural.cardMinhasPorTitulo(cTituloLonga);
      await expect(oCard).toBeVisible({timeout: 20_000});
      await expect(oCard.getByTestId('btn-descricao-toggle')).toHaveText('Ver mais');
      await oCard.getByTestId('btn-descricao-toggle').click();
      await expect(oCard.getByTestId('btn-descricao-toggle')).toHaveText('Ver menos');
      await expect(page.getByTestId('dialog-detalhes-sugestao')).toHaveCount(0);
   });
});
