import type {Page} from '@playwright/test';
import {E2E_TEST_EMAIL} from '../helpers/env';

export class LoginPage {
   constructor(private readonly page: Page) {}

   async garantirSessao(cEmail = E2E_TEST_EMAIL): Promise<void> {
      await this.page.goto('/');
      const oNova = this.page.getByTestId('btn-nova-sugestao');
      const oEmail = this.page.getByTestId('input-login-email');
      await oNova.or(oEmail).waitFor({state: 'visible', timeout: 20_000});
      if (await oNova.isVisible()) {
         return;
      }
      await oEmail.fill(cEmail);
      await this.page.getByTestId('btn-login-entrar').click();
      await oNova.waitFor({state: 'visible', timeout: 20_000});
   }
}
