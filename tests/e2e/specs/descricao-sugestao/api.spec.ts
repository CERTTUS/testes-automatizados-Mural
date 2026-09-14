import {expect, test} from '@playwright/test';
import {
   atualizarSugestaoApi,
   autenticarApi,
   consultarSugestaoApi,
   criarSugestaoApi,
   deletarSugestaoApi,
   listarPilares,
   listarProdutos,
   type oSugestaoCriada,
} from '../../helpers/api';
import {E2E_API_BASE_URL, N_DESCRICAO_SUGESTAO_MAX} from '../../helpers/env';

test.describe('API — limite da descrição (IN-884)', () => {
   let cToken: string;
   let nProduto: number;
   let nPilar: number;
   const mLimpar: number[] = [];

   test.beforeAll(async ({request}) => {
      cToken = await autenticarApi(request);
      const mProdutos = await listarProdutos(request, cToken);
      const mPilares = await listarPilares(request, cToken);
      if (!mProdutos[0] || !mPilares[0]) {
         throw new Error('Massa de produto/pilar ausente na API local.');
      }
      nProduto = mProdutos[0].produto;
      nPilar = mPilares[0].pilarGestao;
   });

   test.afterAll(async ({request}) => {
      for (const nId of mLimpar) {
         await deletarSugestaoApi(request, cToken, nId);
      }
   });

   function oPayloadBase(cDescricao: string, cSufixo: string) {
      return {
         titulo: `QA-API ${cSufixo} ${Date.now()}`.slice(0, 100),
         descricao: cDescricao,
         produto: nProduto,
         pilarGestao: nPilar,
      };
   }

   test('CT-API-01 — Criar sugestão com descrição no teto de 2000 caracteres', async ({
      request,
   }) => {
      const oRes = await criarSugestaoApi(
         request,
         cToken,
         oPayloadBase('A'.repeat(N_DESCRICAO_SUGESTAO_MAX), 'teto'),
      );
      expect(oRes.status(), await oRes.text()).toBe(201);
      const oBody = (await oRes.json()) as oSugestaoCriada;
      expect(oBody.sugestao).toBeTruthy();
      expect(oBody.descricao).toHaveLength(N_DESCRICAO_SUGESTAO_MAX);
      mLimpar.push(Number(oBody.sugestao));
   });

   test('CT-API-02 — Recusar criação com descrição de 2001 caracteres', async ({
      request,
   }) => {
      const oRes = await criarSugestaoApi(
         request,
         cToken,
         oPayloadBase('A'.repeat(N_DESCRICAO_SUGESTAO_MAX + 1), 'acima'),
      );
      expect(oRes.status()).toBe(400);
      const oBody = (await oRes.json()) as {erro?: boolean; mensagem?: string};
      expect(oBody.erro).toBe(true);
      expect(oBody.mensagem).toBe('A descrição deve ter no máximo 2000 caracteres.');
   });

   test('CT-API-03 — Recusar criação com descrição só de espaços', async ({request}) => {
      const oRes = await criarSugestaoApi(
         request,
         cToken,
         oPayloadBase('     ', 'vazia'),
      );
      expect(oRes.status()).toBe(400);
      const oBody = (await oRes.json()) as {erro?: boolean; mensagem?: string};
      expect(oBody.erro).toBe(true);
      expect(oBody.mensagem).toBe('A descrição não pode estar vazia.');
   });

   test('CT-API-04 — Recusar criação sem o campo descrição', async ({request}) => {
      const oRes = await request.post(`${E2E_API_BASE_URL}/sugestoes`,
         {
            headers: {
               Authorization: `Bearer ${cToken}`,
               'Content-Type': 'application/json',
            },
            data: {
               titulo: `QA-API sem-desc ${Date.now()}`.slice(0, 100),
               produto: nProduto,
               pilarGestao: nPilar,
            },
         },
      );
      expect(oRes.status()).toBe(400);
      const oBody = (await oRes.json()) as {erro?: boolean; mensagem?: string};
      expect(oBody.erro).toBe(true);
      expect(oBody.mensagem).toBe('A descrição é obrigatória.');
   });

   test('CT-API-05 — Atualizar sugestão com descrição no teto de 2000 caracteres', async ({
      request,
   }) => {
      const oCriadaRes = await criarSugestaoApi(
         request,
         cToken,
         oPayloadBase('descricao inicial api-05', 'upd-teto'),
      );
      expect(oCriadaRes.status()).toBe(201);
      const oCriada = (await oCriadaRes.json()) as oSugestaoCriada;
      mLimpar.push(Number(oCriada.sugestao));

      const oRes = await atualizarSugestaoApi(request, cToken, Number(oCriada.sugestao), {
         titulo: oCriada.titulo,
         descricao: 'B'.repeat(N_DESCRICAO_SUGESTAO_MAX),
         produto: oCriada.produto?.id ?? nProduto,
         pilarGestao: oCriada.pilarGestao?.id ?? nPilar,
         situacao: oCriada.situacao?.id ?? 2,
      });
      expect(oRes.status(), await oRes.text()).toBe(200);
      const oConsulta = await consultarSugestaoApi(request, cToken, Number(oCriada.sugestao));
      const oAtual = (await oConsulta.json()) as oSugestaoCriada;
      expect(oAtual.descricao).toHaveLength(N_DESCRICAO_SUGESTAO_MAX);
   });

   test('CT-API-06 — Recusar atualização com descrição de 2001 caracteres', async ({
      request,
   }) => {
      const oCriadaRes = await criarSugestaoApi(
         request,
         cToken,
         oPayloadBase('descricao inicial api-06', 'upd-acima'),
      );
      expect(oCriadaRes.status()).toBe(201);
      const oCriada = (await oCriadaRes.json()) as oSugestaoCriada;
      mLimpar.push(Number(oCriada.sugestao));

      const oRes = await atualizarSugestaoApi(request, cToken, Number(oCriada.sugestao), {
         titulo: oCriada.titulo,
         descricao: 'C'.repeat(N_DESCRICAO_SUGESTAO_MAX + 1),
         produto: oCriada.produto?.id ?? nProduto,
         pilarGestao: oCriada.pilarGestao?.id ?? nPilar,
         situacao: oCriada.situacao?.id ?? 2,
      });
      expect(oRes.status()).toBe(400);
      const oBody = (await oRes.json()) as {erro?: boolean; mensagem?: string};
      expect(oBody.erro).toBe(true);
      expect(oBody.mensagem).toBe('A descrição deve ter no máximo 2000 caracteres.');
   });
});
