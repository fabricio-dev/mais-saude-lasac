import { z } from "zod";

const isLocal = (url: URL) =>
  url.hostname === "localhost" || url.hostname === "127.0.0.1";

export const saveWhatsAppConnectionSchema = z.object({
  url: z
    .string()
    .trim()
    .refine(
      (value) => {
        const url = URL.canParse(value) ? new URL(value) : null;
        // https fora da máquina local: a chave viaja no cabeçalho.
        return (
          url !== null &&
          (url.protocol === "https:" ||
            (url.protocol === "http:" && isLocal(url)))
        );
      },
      { message: "Use o endereço https do sistema de atendimento" },
    ),
  // Em branco mantém a chave gravada.
  apiKey: z.string().trim().max(200),
});

export type SaveWhatsAppConnectionInput = z.infer<
  typeof saveWhatsAppConnectionSchema
>;
