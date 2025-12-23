/**
 * Cron job para envio de lembretes de renovação via WhatsApp
 *
 * Regras de negócio:
 * 1. Enviar lembretes de renovação de convênio em 3 momentos:
 *    - D-7: 7 dias antes do vencimento
 *    - D0: No dia do vencimento
 *    - D+30: 30 dias após o vencimento
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
 *    - SEND via WhatsApp Cloud API usando templates aprovados
 *    - UPDATE status para 'sent' ou 'failed'
 */

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq, gte, isNull, lte } from "drizzle-orm";

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
type RenewalType = "RENEWAL_D_7" | "RENEWAL_D_0" | "RENEWAL_D_30";

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

/**
 * Busca pacientes elegíveis para lembrete D-7 (7 dias antes do vencimento)
 *
 * Critérios:
 * - expirationDate = hoje + 7 dias (no timezone de São Paulo, convertido para UTC)
 * - whatsappConsent = true
 * - isActive = true
 * - Ainda não recebeu lembrete D-7 (LEFT JOIN + isNull)
 */
async function getEligiblePatientsForD7(): Promise<EligiblePatient[]> {
  // Calcular a data no timezone de São Paulo e converter para UTC para comparar com o banco
  const targetDateSP = dayjs()
    .tz("America/Sao_Paulo")
    .add(7, "days")
    .startOf("day");
  const targetDate = targetDateSP.utc().toDate();
  const targetDateEnd = targetDateSP.endOf("day").utc().toDate();

  console.log(
    `[D-7] Buscando pacientes com expirationDate entre ${targetDateSP.format("DD/MM/YYYY HH:mm")} (UTC: ${dayjs(targetDate).format("YYYY-MM-DD HH:mm")})`,
  );

  const patients = await db
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
        eq(whatsappNotificationsTable.notificationType, "RENEWAL_D_7"),
      ),
    )
    .where(
      and(
        // Filtros do paciente
        eq(patientsTable.isActive, true),
        eq(patientsTable.whatsappConsent, true),
        gte(patientsTable.expirationDate, targetDate),
        lte(patientsTable.expirationDate, targetDateEnd),
        // Garantir que não foi enviado ainda
        isNull(whatsappNotificationsTable.id),
      ),
    );

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

/**
 * Busca pacientes elegíveis para lembrete D0 (no dia do vencimento)
 *
 * Critérios:
 * - expirationDate = hoje (no timezone de São Paulo, convertido para UTC)
 * - whatsappConsent = true
 * - isActive = true
 * - Ainda não recebeu lembrete D0
 */
async function getEligiblePatientsForD0(): Promise<EligiblePatient[]> {
  // Calcular a data no timezone de São Paulo e converter para UTC
  const todaySP = dayjs().tz("America/Sao_Paulo").startOf("day");
  const today = todaySP.utc().toDate();
  const todayEnd = todaySP.endOf("day").utc().toDate();

  console.log(
    `[D0] Buscando pacientes com expirationDate = ${todaySP.format("DD/MM/YYYY")} (UTC: ${dayjs(today).format("YYYY-MM-DD HH:mm")})`,
  );

  const patients = await db
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
        eq(whatsappNotificationsTable.notificationType, "RENEWAL_D_0"),
      ),
    )
    .where(
      and(
        // eq(patientsTable.isActive, true),
        eq(patientsTable.whatsappConsent, true),
        gte(patientsTable.expirationDate, today),
        lte(patientsTable.expirationDate, todayEnd),
        isNull(whatsappNotificationsTable.id),
      ),
    );

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

/**
 * Busca pacientes elegíveis para lembrete D+30 (30 dias após vencimento)
 *
 * Critérios:
 * - expirationDate = hoje - 30 dias (no timezone de São Paulo, convertido para UTC)
 * - whatsappConsent = true
 * - Ainda não recebeu lembrete D+30
 * - Pode estar inativo (paciente vencido)
 */
async function getEligiblePatientsForD30(): Promise<EligiblePatient[]> {
  // Calcular a data no timezone de São Paulo e converter para UTC
  const targetDateSP = dayjs()
    .tz("America/Sao_Paulo")
    .subtract(30, "days")
    .startOf("day");
  const targetDate = targetDateSP.utc().toDate();
  const targetDateEnd = targetDateSP.endOf("day").utc().toDate();

  console.log(
    `[D+30] Buscando pacientes com expirationDate = ${targetDateSP.format("DD/MM/YYYY")} (UTC: ${dayjs(targetDate).format("YYYY-MM-DD HH:mm")})`,
  );

  const patients = await db
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
        eq(whatsappNotificationsTable.notificationType, "RENEWAL_D_30"),
      ),
    )
    .where(
      and(
        eq(patientsTable.whatsappConsent, true),
        gte(patientsTable.expirationDate, targetDate),
        lte(patientsTable.expirationDate, targetDateEnd),
        isNull(whatsappNotificationsTable.id),
      ),
    );

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
 * 6. Envia via WhatsApp Cloud API
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
  let templateType:
    | "renewal_reminder_d7"
    | "renewal_reminder_d0"
    | "renewal_reminder_d30";

  switch (notificationType) {
    case "RENEWAL_D_7":
      templateType = "renewal_reminder_d7";
      break;
    case "RENEWAL_D_0":
      templateType = "renewal_reminder_d0";
      break;
    case "RENEWAL_D_30":
      templateType = "renewal_reminder_d30";
      break;
  }

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

  // 5. Enviar via WhatsApp Cloud API (usando templates aprovados)
  console.log(
    `[${notificationType}] Enviando lembrete para ${name} (${maskPhoneNumber(targetPhone)})`,
  );

  const result = await sendWhatsAppTemplate({
    phoneNumber: targetPhone,
    templateName: templateConfig.name,
    parameters: templateConfig.parameters,
  });

  // 6. Atualizar status no banco
  await updateNotificationStatus(id, notificationType, result.success);

  return {
    patientId: id,
    patientName: name,
    phone: maskPhoneNumber(targetPhone),
    success: result.success,
    reason: result.success
      ? `Enviado com sucesso (ID: ${result.messageId})`
      : `Falha no envio: ${result.error}`,
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
 * Executa os 3 tipos de lembrete em sequência:
 * 1. D-7 (7 dias antes)
 * 2. D0 (no dia)
 * 3. D+30 (30 dias depois)
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
