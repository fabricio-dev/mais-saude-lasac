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
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Pelo tamanho, e não por "começa com 55": DDD 55 (RS) também começa com 55,
  // e um celular de lá sem o código do país ficaria sem ele.
  // 10 dígitos: DDD + 8 (fixo, ou celular cadastrado sem o 9)
  // 11 dígitos: DDD + 9 + 8
  if (cleaned.length === 10 || cleaned.length === 11) {
    return "55" + cleaned;
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
  const cleaned = formatPhoneNumber(phoneNumber);

  // 55 + DDD + número, com ou sem o 9 do celular: o cadastro tem os dois
  // jeitos, e o whatsapp-ai encontra a ficha do paciente pelas duas formas.
  if (
    !cleaned.startsWith("55") ||
    (cleaned.length !== 12 && cleaned.length !== 13)
  ) {
    return false;
  }

  // Placeholder de quem não tem telefone, "(00) 00000-0000" com ou sem o
  // nono dígito: não existe DDD começando com 0, nem número só de zeros.
  const ddd = cleaned.slice(2, 4);
  const numero = cleaned.slice(4);
  return !ddd.startsWith("0") && !/^0+$/.test(numero);
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
