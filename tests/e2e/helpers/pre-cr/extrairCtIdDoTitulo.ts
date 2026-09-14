/**
 * Extrai ID de cenário do título do teste — CT-* ou CEN-* entre parênteses.
 * Ex.: "deve exibir coluna Agenda (CEN-E2E-01)" → CEN-E2E-01
 */
export function extrairCtIdDoTitulo(titulo: string): string | null {
  const match = titulo.match(/\(((?:CT|CEN)-[A-Z0-9-]+)\)/i);
  return match ? match[1].toUpperCase() : null;
}
