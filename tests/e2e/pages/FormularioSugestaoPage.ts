import type {Page} from '@playwright/test';
import {N_DESCRICAO_SUGESTAO_MAX} from '../helpers/env';

export class FormularioSugestaoPage {
   constructor(private readonly page: Page) {}

   formulario() {
      return this.page.getByTestId('form-upsert-sugestao');
   }

   textareaDescricao() {
      return this.page.getByTestId('textarea-descricao-sugestao');
   }

   contador() {
      return this.page.getByTestId('contador-descricao-sugestao');
   }

   async aguardarAberto(cTitulo: 'Nova sugestão' | 'Editar sugestão' = 'Nova sugestão') {
      await this.page.getByRole('heading', {name: cTitulo}).waitFor({state: 'visible'});
      await this.formulario().waitFor({state: 'visible'});
   }

   async preencherTitulo(cTitulo: string) {
      await this.page.getByTestId('input-titulo-sugestao').fill(cTitulo);
   }

   async preencherDescricao(cTexto: string) {
      await this.textareaDescricao().fill(cTexto);
   }

   async selecionarOpcao(cTestId: 'produto' | 'pilarGestao', cRotulo: string) {
      await this.page.getByTestId(cTestId).click();
      await this.page.getByRole('option', {name: cRotulo, exact: true}).click();
   }

   async enviar() {
      await this.page.getByTestId('btn-enviar-sugestao').click();
   }

   async salvar() {
      await this.page.getByTestId('btn-salvar-sugestao').click();
   }

   async tentarInserirAlemDoTeto() {
      const oCampo = this.textareaDescricao();
      await oCampo.fill('L'.repeat(N_DESCRICAO_SUGESTAO_MAX));
      await oCampo.focus();
      await oCampo.press('End');
      await oCampo.press('x');
   }
}
