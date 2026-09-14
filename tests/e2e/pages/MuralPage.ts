import type {Locator, Page} from '@playwright/test';
import {expect} from '@playwright/test';

export class MuralPage {
   constructor(private readonly page: Page) {}

   listagem() {
      return this.page.getByTestId('listagem-sugestoes');
   }

   carrosselMinhas() {
      return this.page.getByTestId('carousel-minhas-sugestoes');
   }

   cardListagemPorTitulo(cTitulo: string): Locator {
      return this.listagem()
         .getByTestId('suggestion-card')
         .filter({has: this.page.getByTestId('suggestion-card-titulo').getByText(cTitulo, {exact: true})});
   }

   cardMinhasPorTitulo(cTitulo: string): Locator {
      return this.carrosselMinhas()
         .getByTestId('featured-card')
         .filter({hasText: cTitulo});
   }

   async abrirNovaSugestao() {
      await this.page.getByTestId('btn-nova-sugestao').click();
   }

   async filtrarTodasSituacoes() {
      const oGatilho = this.page.getByRole('button', {name: /Em revisão|Postado|Todas as situações/});
      await oGatilho.first().click();
      await this.page.getByText('Todas as situações', {exact: true}).click();
      await this.page.keyboard.press('Escape');
   }

   async buscar(cTermo: string) {
      await this.page.getByPlaceholder('Buscar sugestões...').fill(cTermo);
   }

   async esperarCardListagem(cTitulo: string) {
      await this.filtrarTodasSituacoes();
      await this.buscar(cTitulo);
      await expect(this.cardListagemPorTitulo(cTitulo)).toBeVisible({timeout: 20_000});
   }

   async abrirDetalhesPeloCard(cTitulo: string) {
      await this.cardListagemPorTitulo(cTitulo).getByTestId('suggestion-card-titulo').click();
      await expect(this.page.getByTestId('dialog-detalhes-sugestao')).toBeVisible();
   }

   async abrirEdicaoPeloCard(cTitulo: string) {
      const oCard = this.cardListagemPorTitulo(cTitulo);
      await oCard.getByTestId('btn-card-menu').click();
      await this.page.getByTestId('menu-editar-sugestao').click();
   }
}
