import type {APIRequestContext} from '@playwright/test';
import {E2E_API_BASE_URL, E2E_TEST_EMAIL} from './env';

export type oTokensDev = {
   acessoToken: string;
};

export type oSugestaoCriada = {
   sugestao: number;
   titulo: string;
   descricao: string;
   situacao?: {id?: number; nome?: string};
   produto?: {id?: number};
   pilarGestao?: {id?: number};
};

export async function autenticarApi(
   request: APIRequestContext,
   cEmail = E2E_TEST_EMAIL,
): Promise<string> {
   const oRes = await request.post(`${E2E_API_BASE_URL}/autenticacao/dev-login`, {
      data: {email: cEmail},
   });
   const oBody = (await oRes.json()) as oTokensDev & {erro?: boolean; mensagem?: string};
   if (!oRes.ok() || !oBody.acessoToken) {
      throw new Error(
         `Falha no dev-login (${oRes.status()}): ${oBody.mensagem || 'sem token'}`,
      );
   }
   return oBody.acessoToken;
}

export function headersBearer(cToken: string): Record<string, string> {
   return {
      Authorization: `Bearer ${cToken}`,
      'Content-Type': 'application/json',
   };
}

export async function listarProdutos(
   request: APIRequestContext,
   cToken: string,
): Promise<Array<{produto: number; nome: string}>> {
   const oRes = await request.get(`${E2E_API_BASE_URL}/produtos`, {
      headers: headersBearer(cToken),
   });
   if (!oRes.ok()) {
      throw new Error(`GET /produtos ${oRes.status()}`);
   }
   return (await oRes.json()) as Array<{produto: number; nome: string}>;
}

export async function listarPilares(
   request: APIRequestContext,
   cToken: string,
): Promise<Array<{pilarGestao: number; nome: string}>> {
   const oRes = await request.get(`${E2E_API_BASE_URL}/pilaresGestao`, {
      headers: headersBearer(cToken),
   });
   if (!oRes.ok()) {
      throw new Error(`GET /pilaresGestao ${oRes.status()}`);
   }
   return (await oRes.json()) as Array<{pilarGestao: number; nome: string}>;
}

export async function criarSugestaoApi(
   request: APIRequestContext,
   cToken: string,
   oPayload: {
      titulo: string;
      descricao: string;
      produto: number;
      pilarGestao: number;
   },
) {
   return request.post(`${E2E_API_BASE_URL}/sugestoes`, {
      headers: headersBearer(cToken),
      data: oPayload,
   });
}

export async function atualizarSugestaoApi(
   request: APIRequestContext,
   cToken: string,
   nId: number,
   oPayload: Record<string, unknown>,
) {
   return request.put(`${E2E_API_BASE_URL}/sugestoes/${nId}`, {
      headers: headersBearer(cToken),
      data: oPayload,
   });
}

export async function consultarSugestaoApi(
   request: APIRequestContext,
   cToken: string,
   nId: number,
) {
   return request.get(`${E2E_API_BASE_URL}/sugestoes/${nId}`, {
      headers: headersBearer(cToken),
   });
}

export async function deletarSugestaoApi(
   request: APIRequestContext,
   cToken: string,
   nId: number,
) {
   return request.delete(`${E2E_API_BASE_URL}/sugestoes/${nId}`, {
      headers: headersBearer(cToken),
   });
}
