import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getPartnersListFile,
  PARTNERS_LIST_FALLBACK,
} from "@/data/partners-list-file";

/**
 * A lista de parceiros em PDF. Pública: quem baixa é a Meta, na hora de
 * enviar a mensagem de ativação, sem sessão nenhuma.
 *
 * Serve o arquivo enviado em /whatsapp; enquanto nenhum foi enviado, o que
 * veio no código.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const stored = await getPartnersListFile();

  const content =
    stored?.content ??
    (await readFile(path.join(process.cwd(), PARTNERS_LIST_FALLBACK)).catch(
      () => null,
    ));
  if (!content) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="lista-de-parceiros.pdf"',
      // Curto: o arquivo trocado na tela precisa valer no próximo envio.
      "Cache-Control": "public, max-age=60",
    },
  });
}
