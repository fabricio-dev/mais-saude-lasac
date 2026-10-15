/**
 * Cron job para envio de lembretes de renovação via WhatsApp
 *
 * Regras de negócio:
 * 1. Enviar lembretes de renovação de convênio, cada um com recuperação para
 *    quem ficou para trás porque o cron não rodou ou um dos sistemas (este ou
 *    o whatsapp-ai) estava fora do ar:
 *    - D-7: vence entre amanhã (D-1) e daqui a 7 dias. O aviso antecipado é o
 *      que mais converte em renovação, então quem perdeu o dia 7 ainda recebe.
 *    - D0: vence hoje. Só no dia — o texto diz "hoje".
 *    - D0 atrasado: venceu há 1 a 29 dias sem ter recebido o D0
 *      ("venceu em {{data}}"). Ligado por WHATSAPP_D0_LATE_ENABLED=true, depois
 *      que o template lembrete_vencimento_atrasado for aprovado na Meta.
 *    - D+30: venceu há 30 dias ou mais. No máximo WHATSAPP_D30_DAILY_LIMIT
 *      (padrão 100) por execução, dos vencidos mais recentes para os mais
 *      antigos: o número é o mesmo do atendimento, com teto diário da Meta.
 *
 * 2. Cada lembrete é enviado apenas UMA VEZ por paciente
 *    - O banco usa UNIQUE constraint (patientId, notificationType) como lock
 *
 * 3. Todos os lembretes são do tipo Marketing (exigem whatsappConsent = true)
 *
 * 4. Proteção em ambiente DEV:
 *    - Só envia para WHATSAPP_TEST_PHONE
 *
 * 5. Fluxo de envio:
 *    - SELECT pacientes elegíveis
 *    - INSERT em whatsapp_notifications (status = 'pending') como lock
 *    - Se falhar por UNIQUE constraint, pula (já foi enviado)
 *    - SEND pelo whatsapp-ai (mesmo número do atendimento), que aplica o
 *      descadastro e registra o envio na ficha do paciente
 *    - UPDATE status para 'sent' (na fila do atendimento) ou 'failed'
 */

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { db } from "@/db";

// Configurar dayjs para trabalhar com timezones
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  clinicsTable,
  // notificationTypeEnum,
  patientsTable,
  whatsappNotificationsTable,
  // whatsappNotificationStatusEnum,
} from "@/db/schema";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { getTemplateConfig } from "@/lib/whatsapp/templates";
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  maskPhoneNumber,
} from "@/lib/whatsapp/utils";

/**
 * Tipos de lembrete de renovação
 */
type RenewalType =
  | "RENEWAL_D_7"
  | "RENEWAL_D_0"
  | "RENEWAL_D_0_LATE"
  | "RENEWAL_D_30";

/** O template aprovado de cada lembrete (ver getTemplateConfig). */
const TEMPLATE_TYPE = {
  RENEWAL_D_7: "renewal_reminder_d7",
  RENEWAL_D_0: "renewal_reminder_d0",
  RENEWAL_D_0_LATE: "renewal_reminder_d0_late",
  RENEWAL_D_30: "renewal_reminder_d30",
} as const satisfies Record<RenewalType, string>;

/** Rótulo de cada lembrete no relatório do atendimento. */
const CATEGORY: Record<RenewalType, string> = {
  RENEWAL_D_7: "Vencimento em 7 dias",
  RENEWAL_D_0: "Vencimento hoje",
  RENEWAL_D_0_LATE: "Vencido (aviso atrasado)",
  RENEWAL_D_30: "Vencido há 30 dias ou mais",
};

/**
 * Paciente elegível para receber lembrete
 */
interface EligiblePatient {
  id: string;
  name: string;
  phoneNumber: string;
  expirationDate: Date;
  clinicId: string;
  clinicName: string;
  whatsappConsent: boolean;
}

/**
 * Resultado do processamento de um paciente
 */
interface ProcessingResult {
  patientId: string;
  patientName: string;
  phone: string;
  success: boolean;
  reason: string;
  notificationType: RenewalType;
}

/** Início e fim de um dia relativo a hoje, em São Paulo, convertidos para UTC. */
function daySP(offsetDays: number) {
  const day = dayjs().tz("America/Sao_Paulo").add(offsetDays, "day");
  return {
    start: day.startOf("day").utc().toDate(),
    end: day.endOf("day").utc().toDate(),
    label: day.format("DD/MM/YYYY"),
  };
}

/**
 * Pacientes com consentimento, vencimento dentro de [from, to] e sem nenhuma
 * das notificações em `notSent` — é a trava que impede reenvio.
 */
async function findEligiblePatients(params: {
  from?: Date;
  to: Date;
  notSent: RenewalType[];
  onlyActive?: boolean;
  /** Mais recentes primeiro, com teto: o acúmulo drena ao longo dos dias. */
  limit?: number;
}): Promise<EligiblePatient[]> {
  const query = db
    .select({
      id: patientsTable.id,
      name: patientsTable.name,
      phoneNumber: patientsTable.phoneNumber,
      expirationDate: patientsTable.expirationDate,
      clinicId: patientsTable.clinicId,
      clinicName: clinicsTable.name,
      whatsappConsent: patientsTable.whatsappConsent,
    })
    .from(patientsTable)
    .leftJoin(clinicsTable, eq(patientsTable.clinicId, clinicsTable.id))
    .leftJoin(
      whatsappNotificationsTable,
      and(
        eq(whatsappNotificationsTable.patientId, patientsTable.id),
        inArray(whatsappNotificationsTable.notificationType, params.notSent),
      ),
    )
    .where(
      and(
        params.onlyActive ? eq(patientsTable.isActive, true) : undefined,
        eq(patientsTable.whatsappConsent, true),
        params.from
          ? gte(patientsTable.expirationDate, params.from)
          : undefined,
        lte(patientsTable.expirationDate, params.to),
        isNull(whatsappNotificationsTable.id),
      ),
    )
    .orderBy(desc(patientsTable.expirationDate))
    .$dynamic();

  const patients = await (params.limit ? query.limit(params.limit) : query);

  return patients.map((p) => ({
    id: p.id,
    name: p.name,
    phoneNumber: p.phoneNumber,
    expirationDate: p.expirationDate!,
    clinicId: p.clinicId!,
    clinicName: p.clinicName!,
    whatsappConsent: p.whatsappConsent,
  }));
}

/** D-7: vence entre amanhã e daqui a 7 dias, e ainda não recebeu o D-7. */
async function getEligiblePatientsForD7(): Promise<EligiblePatient[]> {
  const from = daySP(1);
  const to = daySP(7);
  console.log(`[D-7] Vencimento entre ${from.label} e ${to.label}`);

  return findEligiblePatients({
    from: from.start,
    to: to.end,
    notSent: ["RENEWAL_D_7"],
    onlyActive: true,
  });
}

/** D0: vence hoje. Sem recuperação aqui — quem perder vai para o D0 atrasado. */
async function getEligiblePatientsForD0(): Promise<EligiblePatient[]> {
  const today = daySP(0);
  console.log(`[D0] Vencimento em ${today.label}`);

  return findEligiblePatients({
    from: today.start,
    to: today.end,
    notSent: ["RENEWAL_D_0"],
  });
}

/** D0 atrasado: venceu há 1 a 29 dias e não recebeu nem o D0 nem este. */
async function getEligiblePatientsForD0Late(): Promise<EligiblePatient[]> {
  const from = daySP(-29);
  const to = daySP(-1);
  console.log(`[D0 atrasado] Vencimento entre ${from.label} e ${to.label}`);

  return findEligiblePatients({
    from: from.start,
    to: to.end,
    notSent: ["RENEWAL_D_0", "RENEWAL_D_0_LATE"],
  });
}

const D30_DAILY_LIMIT = Math.max(
  1,
  Number.parseInt(process.env.WHATSAPP_D30_DAILY_LIMIT ?? "", 10) || 100,
);

/** D+30: venceu há 30 dias ou mais e ainda não recebeu o D+30. */
async function getEligiblePatientsForD30(): Promise<EligiblePatient[]> {
  const to = daySP(-30);
  console.log(
    `[D+30] Vencimento até ${to.label}, no máximo ${D30_DAILY_LIMIT} nesta execução`,
  );

  return findEligiblePatients({
    to: to.end,
    notSent: ["RENEWAL_D_30"],
    limit: D30_DAILY_LIMIT,
  });
}

/**
 * Cria registro de notificação no banco (lock)
 *
 * Se falhar por UNIQUE constraint, significa que já foi criado
 * (proteção contra duplicação, mesmo se cron rodar 2x)
 *
 * @returns true se criou com sucesso, false se já existe
 */
async function createNotificationLock(
  patientId: string,
  clinicId: string,
  notificationType: RenewalType,
  templateName: string,
): Promise<boolean> {
  try {
    await db.insert(whatsappNotificationsTable).values({
      patientId,
      clinicId,
      notificationType,
      templateName,
      status: "pending",
    });

    return true;
  } catch (error) {
    // Se falhar por UNIQUE constraint, é porque já existe
    if (
      error instanceof Error &&
      (error.message.includes("unique") ||
        error.message.includes("duplicate key"))
    ) {
      console.log(
        `[LOCK] Notificação ${notificationType} já existe para paciente ${patientId}`,
      );
      return false;
    }

    // Outro erro, propagar
    throw error;
  }
}

/**
 * Atualiza status da notificação após tentativa de envio
 */
async function updateNotificationStatus(
  patientId: string,
  notificationType: RenewalType,
  success: boolean,
): Promise<void> {
  const status = success ? "sent" : "failed";
  const sentAt = success ? new Date() : null;

  await db
    .update(whatsappNotificationsTable)
    .set({
      status,
      sentAt,
    })
    .where(
      and(
        eq(whatsappNotificationsTable.patientId, patientId),
        eq(whatsappNotificationsTable.notificationType, notificationType),
      ),
    );
}

/**
 * Desfaz a trava de um envio que não chegou ao whatsapp-ai por falha
 * passageira (sistema fora do ar, rede, configuração). A próxima execução
 * encontra o paciente de novo, se ele ainda estiver na janela do lembrete.
 */
async function releaseNotificationLock(
  patientId: string,
  notificationType: RenewalType,
): Promise<void> {
  await db
    .delete(whatsappNotificationsTable)
    .where(
      and(
        eq(whatsappNotificationsTable.patientId, patientId),
        eq(whatsappNotificationsTable.notificationType, notificationType),
      ),
    );
}

/**
 * Aplica proteção de ambiente DEV
 * Em DEV, só permite enviar para WHATSAPP_TEST_PHONE
 */
function applyDevProtection(phoneNumber: string): string {
  const whatsappEnv = process.env.WHATSAPP_ENV || "dev";
  const testPhone = process.env.WHATSAPP_TEST_PHONE;

  if (whatsappEnv === "dev" && testPhone) {
    console.log(
      `[DEV] Redirecionando envio de ${maskPhoneNumber(phoneNumber)} para ${maskPhoneNumber(testPhone)}`,
    );
    return testPhone;
  }

  return phoneNumber;
}

/**
 * Processa um paciente: cria lock, envia WhatsApp e atualiza status
 *
 * Fluxo:
 * 1. Valida telefone
 * 2. Obtém template aprovado da Meta
 * 3. Cria lock no banco (INSERT com status = 'pending')
 * 4. Se lock falhar (já existe), pula paciente
 * 5. Aplica proteção DEV
 * 6. Pede o envio ao whatsapp-ai
 * 7. Atualiza status para 'sent' ou 'failed'
 */
async function processPatient(
  patient: EligiblePatient,
  notificationType: RenewalType,
): Promise<ProcessingResult> {
  const { id, name, phoneNumber, expirationDate, clinicId, clinicName } =
    patient;

  // 1. Validar telefone
  const formattedPhone = formatPhoneNumber(phoneNumber);

  if (!isValidPhoneNumber(formattedPhone)) {
    console.error(
      `[${notificationType}] Telefone inválido para paciente ${name}: ${maskPhoneNumber(phoneNumber)}`,
    );

    return {
      patientId: id,
      patientName: name,
      phone: maskPhoneNumber(phoneNumber),
      success: false,
      reason: "Telefone inválido",
      notificationType,
    };
  }

  // 2. Obter template aprovado da Meta
  // IMPORTANTE: getTemplateConfig retorna template pré-aprovado
  // Não criar texto livre, não inventar template
  // Mapear o tipo de notificação para o template correto
  const templateType = TEMPLATE_TYPE[notificationType];

  const templateConfig = getTemplateConfig(templateType, {
    patientName: name,
    expirationDate: expirationDate,
    clinicName: clinicName,
  });

  // 3. Criar lock no banco (proteção contra duplicação)
  const lockCreated = await createNotificationLock(
    id,
    clinicId,
    notificationType,
    templateConfig.name,
  );

  if (!lockCreated) {
    return {
      patientId: id,
      patientName: name,
      phone: maskPhoneNumber(formattedPhone),
      success: false,
      reason: "Notificação já enviada anteriormente (lock)",
      notificationType,
    };
  }

  // 4. Aplicar proteção DEV (redirecionar para número de teste)
  const targetPhone = applyDevProtection(formattedPhone);

  // 5. Pedir o envio ao whatsapp-ai (templates aprovados, mesmo número)
  console.log(
    `[${notificationType}] Enviando lembrete para ${name} (${maskPhoneNumber(targetPhone)})`,
  );

  // A validade entra no id: depois de uma renovação, o próximo ciclo é outro
  // envio — e rodar o cron duas vezes no mesmo dia não manda duas vezes.
  const ciclo = dayjs(expirationDate)
    .tz("America/Sao_Paulo")
    .format("YYYY-MM-DD");

  const result = await sendWhatsAppTemplate({
    externalId: `${notificationType}:${id}:${ciclo}`,
    phoneNumber: targetPhone,
    patientName: name,
    category: CATEGORY[notificationType],
    templateName: templateConfig.name,
    parameters: templateConfig.parameters,
  });

  // 6. Atualizar status no banco. Pulado (descadastro no atendimento) conta
  // como não enviado: o paciente não recebeu, e não adianta tentar de novo.
  // Falha passageira libera a trava para a próxima execução recuperar.
  const sent = result.success && result.status === "queued";
  if (!result.success && result.retryable) {
    await releaseNotificationLock(id, notificationType);
  } else {
    await updateNotificationStatus(id, notificationType, sent);
  }

  return {
    patientId: id,
    patientName: name,
    phone: maskPhoneNumber(targetPhone),
    success: sent,
    reason: !result.success
      ? `Falha no envio: ${result.error}` +
        (result.retryable ? " (nova tentativa na próxima execução)" : "")
      : sent
        ? `Na fila do atendimento (ID: ${result.id})`
        : `Pulado pelo atendimento: ${result.reason}`,
    notificationType,
  };
}

/**
 * Processa todos os lembretes de um tipo específico
 */
async function processRenewalType(
  type: RenewalType,
  getEligiblePatients: () => Promise<EligiblePatient[]>,
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`[${type}] Iniciando processamento`);
  console.log(`========================================\n`);

  try {
    // 1. Buscar pacientes elegíveis
    const patients = await getEligiblePatients();

    if (patients.length === 0) {
      console.log(`[${type}] Nenhum paciente elegível encontrado`);
      return;
    }

    console.log(`[${type}] ${patients.length} pacientes elegíveis encontrados`);

    // 2. Processar cada paciente
    const results: ProcessingResult[] = [];

    for (const patient of patients) {
      try {
        const result = await processPatient(patient, type);
        results.push(result);

        // Pequeno delay entre envios para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `[${type}] Erro ao processar paciente ${patient.name}:`,
          error,
        );

        results.push({
          patientId: patient.id,
          patientName: patient.name,
          phone: maskPhoneNumber(patient.phoneNumber),
          success: false,
          reason:
            error instanceof Error
              ? error.message
              : "Erro desconhecido no processamento",
          notificationType: type,
        });
      }
    }

    // 3. Resumo dos resultados
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`\n[${type}] ===== RESUMO =====`);
    console.log(`[${type}] Total processados: ${results.length}`);
    console.log(`[${type}] ✅ Sucesso: ${successful}`);
    console.log(`[${type}] ❌ Falhas: ${failed}`);

    if (failed > 0) {
      console.log(`\n[${type}] Detalhes das falhas:`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`  - ${r.patientName} (${r.phone}): ${r.reason}`);
        });
    }
  } catch (error) {
    console.error(`[${type}] Erro crítico no processamento:`, error);
    throw error;
  }
}

/**
 * Função principal do cron
 *
 * Executa os lembretes em sequência (janelas no cabeçalho do arquivo):
 * 1. D-7 (vence em 1 a 7 dias)
 * 2. D0 (vence hoje)
 * 3. D0 atrasado (venceu há 1 a 29 dias, se ligado)
 * 4. D+30 (venceu há 30 dias ou mais, com teto por execução)
 *
 * Uso:
 * - Pode ser chamada manualmente: await runWhatsAppRenewalCron()
 * - Ou configurada em um cron job externo (Vercel Cron, node-cron, etc)
 */
export async function runWhatsAppRenewalCron(): Promise<void> {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     CRON: Lembretes de Renovação via WhatsApp         ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log(
    `Executado em: ${dayjs().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm:ss")} (SP)`,
  );
  console.log(`Timezone: America/Sao_Paulo (UTC-3)`);
  console.log(`⚠️  Datas no banco estão em UTC, convertendo automaticamente`);

  const startTime = Date.now();

  try {
    // Verificar se WhatsApp está habilitado
    if (process.env.WHATSAPP_ENABLED !== "true") {
      console.log("⚠️  WhatsApp está desabilitado. Cron abortado.");
      return;
    }

    // Processar cada tipo de lembrete
    await processRenewalType("RENEWAL_D_7", getEligiblePatientsForD7);
    await processRenewalType("RENEWAL_D_0", getEligiblePatientsForD0);
    if (process.env.WHATSAPP_D0_LATE_ENABLED === "true") {
      await processRenewalType(
        "RENEWAL_D_0_LATE",
        getEligiblePatientsForD0Late,
      );
    } else {
      console.log(
        "\n[RENEWAL_D_0_LATE] Desligado (WHATSAPP_D0_LATE_ENABLED != true)",
      );
    }
    await processRenewalType("RENEWAL_D_30", getEligiblePatientsForD30);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║            CRON FINALIZADO COM SUCESSO                ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(`Tempo total: ${duration}s`);
    console.log("\n");
  } catch (error) {
    console.error("\n❌ ERRO CRÍTICO NO CRON:", error);
    throw error;
  }
}

/**
 * Script para execução standalone
 * Permite testar o cron manualmente: node --loader ts-node/esm src/cron/whatsapp-renewal-cron.ts
 */
if (require.main === module) {
  runWhatsAppRenewalCron()
    .then(() => {
      console.log("✅ Cron executado com sucesso");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro ao executar cron:", error);
      process.exit(1);
    });
}
