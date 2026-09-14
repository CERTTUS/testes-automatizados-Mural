export function cEnv(cChave: string, cPadrao = ''): string {
   return (process.env[cChave] || cPadrao).trim();
}

export const E2E_BASE_URL = cEnv('E2E_BASE_URL', 'http://localhost:8080');
export const E2E_API_BASE_URL = cEnv('E2E_API_BASE_URL', 'http://127.0.0.1:8085').replace(
   /\/+$/,
   '',
);
export const E2E_TEST_EMAIL = cEnv('E2E_TEST_EMAIL', 'admin@certtus.com');
export const N_DESCRICAO_SUGESTAO_MAX = 2000;
