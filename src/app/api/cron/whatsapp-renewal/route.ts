/**
 * API Route para execução do cron de lembretes de renovação via WhatsApp
 *
 * Uso com Vercel Cron (recomendado):
 * - Adicionar em vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/whatsapp-renewal",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 *
 * Segurança:
 * - Validar CRON_SECRET para evitar execução não autorizada
 * - Adicionar CRON_SECRET no .env e no Vercel
 */

import { NextResponse } from "next/server";

import { runWhatsAppRenewalCron } from "@/cron/whatsapp-renewal-cron";

export const maxDuration = 300; // 5 minutos de timeout (ajustar conforme necessidade)

export async function GET(request: Request) {
  console.log("[API] Cron de lembretes WhatsApp chamado");

  // Validar token de segurança (IMPORTANTE em produção)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[API] Tentativa de acesso não autorizado ao cron");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ligado/desligado, hora e dia vêm da tela /whatsapp: chamar esta rota de
    // hora em hora é seguro — ela só dispara uma vez por dia.
    const outcome = await runWhatsAppRenewalCron();

    return NextResponse.json({
      success: true,
      executed: outcome.executed,
      message: outcome.executed
        ? "Cron de lembretes executado com sucesso"
        : `Não disparou: ${outcome.reason}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Erro ao executar cron:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        executed: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
