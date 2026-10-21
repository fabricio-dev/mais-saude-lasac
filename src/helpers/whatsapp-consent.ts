import { z } from "zod";

const WHATSAPP_CONSENT_REQUIRED_MESSAGE =
  "Selecione se autoriza ou não as mensagens por WhatsApp";

/**
 * Consentimento de WhatsApp sem valor padrão: quem cadastra precisa escolher
 * "Sim" ou "Não". Antes a caixa vinha marcada e o paciente entrava com
 * consentimento sem que ninguém tivesse decidido.
 */
export const whatsappConsentSchema = z.boolean({
  required_error: WHATSAPP_CONSENT_REQUIRED_MESSAGE,
  invalid_type_error: WHATSAPP_CONSENT_REQUIRED_MESSAGE,
});
