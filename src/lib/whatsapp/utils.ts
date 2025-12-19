/**
 * Utilitários para WhatsApp
 */

/**
 * Formata número de telefone para o formato internacional
 * Remove caracteres especiais e adiciona código do país se necessário
 *
 * @param phoneNumber - Número de telefone no formato brasileiro
 * @returns Número formatado no padrão internacional (ex: 5511999999999)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove todos os caracteres não numéricos
  let cleaned = phoneNumber.replace(/\D/g, "");

  // Se não começar com 55 (código do Brasil), adicionar
  if (!cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }

  return cleaned;
}

/**
 * Valida se o número de telefone é válido
 *
 * @param phoneNumber - Número de telefone a ser validado
 * @returns true se o número for válido
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Telefone brasileiro deve ter 11 dígitos (DDD + 9 dígitos)
  // Ou 13 dígitos com código do país (55 + DDD + 9 dígitos)
  return cleaned.length === 11 || cleaned.length === 13;
}

/**
 * Mascara o número de telefone para logs (privacidade)
 *
 * @param phoneNumber - Número de telefone a ser mascarado
 * @returns Número mascarado (ex: (11) 9****-1234)
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.length < 10) {
    return "****";
  }

  // Pegar últimos 4 dígitos
  const lastFour = cleaned.slice(-4);
  // Pegar DDD (assumindo formato brasileiro)
  const ddd =
    cleaned.length >= 11 ? cleaned.slice(-11, -9) : cleaned.slice(0, 2);

  return `(${ddd}) 9****-${lastFour}`;
}
