import { getHeaderMedia } from "@/data/whatsapp-header-media";
import {
  headerMediaFileName,
  headerMediaFormatOf,
  type HeaderMediaType,
  MESSAGE_KEYS,
  type MessageKey,
} from "@/lib/whatsapp/message-templates";

/**
 * O arquivo do cabeçalho de um lembrete (`reminder_d30.jpg`, `.pdf`, `.mp4`).
 * Público: quem baixa é a Meta, na hora de enviar o lembrete, sem sessão
 * nenhuma.
 */
export const dynamic = "force-dynamic";

const isMessageKey = (value: string): value is MessageKey =>
  (MESSAGE_KEYS as readonly string[]).includes(value);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const key = file.split(".")[0];
  if (!isMessageKey(key)) return new Response("Not found", { status: 404 });

  const media = await getHeaderMedia(key);
  if (
    !media ||
    headerMediaFormatOf(media.mimeType) === null ||
    // Só o nome que o envio monta: a extensão é a do arquivo guardado.
    file !== headerMediaFileName(key, media.mimeType as HeaderMediaType)
  ) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(media.content), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.content.byteLength),
      // O tipo vem da assinatura do começo do arquivo, e o resto não é
      // conferido: sem isto, o navegador poderia "adivinhar" HTML num arquivo
      // montado para parecer imagem e rodá-lo no domínio do sistema.
      "X-Content-Type-Options": "nosniff",
      // Curto, como o PDF de parceiros; o `v` do link já troca a cada arquivo.
      "Cache-Control": "public, max-age=60",
    },
  });
}
