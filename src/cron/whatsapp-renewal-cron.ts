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
 *      ("venceu em {{data}}"). Ligado na tela depois que o template
 *      lembrete_vencimento_atrasado for aprovado na Meta.
 *    - D+30: venceu há 30 dias ou mais.
 *      O D0 atrasado e o D+30 dividem um só teto por execução, dos vencidos
 *      mais recentes para os mais antigos: o número é o mesmo do atendimento,
 *      com teto diário da Meta.
 *
 *    Cada lembrete liga e desliga na tela /whatsapp, onde também ficam o teto
 *    do D+30, o número de contato e o horário e os dias do disparo. O crontab
 *    chama este script de hora em hora; ele dispara uma vez por dia, na
 *    primeira chamada a partir da hora escolhida (claimScheduledRun).
 *
 * 2. Cada lembrete é enviado apenas UMA VEZ por paciente
 *    - O banco usa UNIQUE constraint (patientId, notificationType) como lock
 *
 * 3. Todos os lembretes são do tipo Marketing (exigem whatsappConsent = true)
 *
 * 4. Proteção em ambiente DEV:
 *    - Só envia para WHATSAPP_TEST_PHONE (em sendWhatsAppTemplate, que vale
 *      também para as confirmações de ativação e renovação)
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
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";

import { getMessageTemplates } from "@/data/whatsapp-message-templates";
import {
  claimScheduledRun,
  getWhatsAppSettings,
} from "@/data/whatsapp-settings";
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
import {
  buildTemplateParameters,
  type MessageKey,
  type MessageTemplateConfig,
} from "@/lib/whatsapp/message-templates";
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

/** A mensagem de cada lembrete — o modelo dela é escolhido em /whatsapp. */
const MESSAGE_KEY = {
  RENEWAL_D_7: "reminder_d7",
  RENEWAL_D_0: "reminder_d0",
  RENEWAL_D_0_LATE: "reminder_d0_late",
  RENEWAL_D_30: "reminder_d30",
} as const satisfies Record<RenewalType, MessageKey>;

/** O que todo paciente de um lembrete compartilha numa execução. */
type ReminderSend = {
  template: MessageTemplateConfig;
  officialNumber: string | null;
};

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
  /**
   * Ordem por vencimento. Padrão: os mais recentes primeiro, que serve ao
   * passivo. O D-7 usa "asc": com teto, quem vence antes tem de sair antes, ou
   * perde a janela.
   */
  order?: "asc" | "desc";
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
    .orderBy(
      params.order === "asc"
        ? asc(patientsTable.expirationDate)
        : desc(patientsTable.expirationDate),
    )
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

/**
 * D-7: vence entre amanhã e daqui a 7 dias, e ainda não recebeu o D-7. Com
 * teto, quem vence antes sai antes; o resto fica para o dia seguinte, ainda
 * dentro da janela.
 */
async function getEligiblePatientsForD7(
  limit: number,
): Promise<EligiblePatient[]> {
  const from = daySP(1);
  const to = daySP(7);
  console.log(
    `[D-7] Vencimento entre ${from.label} e ${to.label}, no máximo ${limit} nesta execução`,
  );

  return findEligiblePatients({
    from: from.start,
    to: to.end,
    notSent: ["RENEWAL_D_7"],
    onlyActive: true,
    limit,
    order: "asc",
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
async function getEligiblePatientsForD0Late(
  limit: number,
): Promise<EligiblePatient[]> {
  const from = daySP(-29);
  const to = daySP(-1);
  console.log(
    `[D0 atrasado] Vencimento entre ${from.label} e ${to.label}, no máximo ${limit} nesta execução`,
  );

  return findEligiblePatients({
    from: from.start,
    to: to.end,
    notSent: ["RENEWAL_D_0", "RENEWAL_D_0_LATE"],
    limit,
  });
}

/** D+30: venceu há 30 dias ou mais e ainda não recebeu o D+30. */
async function getEligiblePatientsForD30(
  limit: number,
): Promise<EligiblePatient[]> {
  const to = daySP(-30);
  console.log(
    `[D+30] Vencimento até ${to.label}, no máximo ${limit} nesta execução`,
  );

  return findEligiblePatients({
    to: to.end,
    notSent: ["RENEWAL_D_30"],
    limit,
  });
}

function isUniqueViolation(error: unknown): boolean {
  const code = (err: unknown) =>
    typeof err === "object" && err !== null && "code" in err
      ? (err as { code?: unknown }).code
      : undefined;
  return (
    code(error) === "23505" ||
    (error instanceof Error && code(error.cause) === "23505")
  );
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
    // Se falhar por UNIQUE constraint, é porque já existe. Pelo código do
    // Postgres (23505): desde o drizzle-orm 0.44 o erro do driver chega
    // embrulhado num DrizzleQueryError, em `cause`, e a mensagem de fora não
    // diz mais "duplicate key".
    if (isUniqueViolation(error)) {
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
  failureReason: string | null = null,
): Promise<void> {
  const status = success ? "sent" : "failed";
  const sentAt = success ? new Date() : null;

  await db
    .update(whatsappNotificationsTable)
    .set({
      status,
      sentAt,
      failureReason: success ? null : failureReason,
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
 * Processa um paciente: cria lock, envia WhatsApp e atualiza status
 *
 * Fluxo:
 * 1. Obtém template aprovado da Meta
 * 2. Cria lock no banco (INSERT com status = 'pending')
 * 3. Se lock falhar (já existe), pula paciente
 * 4. Telefone inválido fica 'failed' com o motivo — sem o lock, o mesmo
 *    paciente voltaria a cada execução e ocuparia o teto do D+30
 * 5. Pede o envio ao whatsapp-ai (que em DEV redireciona ao número de teste)
 * 6. Atualiza status para 'sent' ou 'failed'
 */
async function processPatient(
  patient: EligiblePatient,
  notificationType: RenewalType,
  { template, officialNumber }: ReminderSend,
): Promise<ProcessingResult> {
  const { id, name, phoneNumber, expirationDate, clinicId, clinicName } =
    patient;
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // 1. O modelo escolhido em /whatsapp e os valores deste paciente
  const templateConfig = {
    name: template.templateName,
    language: template.templateLanguage,
    parameters: buildTemplateParameters(template.params, {
      patientName: name,
      expirationDate,
      clinicName,
      officialNumber,
    }),
  };

  // 2. Criar lock no banco (proteção contra duplicação)
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

  // 3. Validar telefone (com ou sem o 9 do celular)
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(
      `[${notificationType}] Telefone inválido para paciente ${name}: ${maskPhoneNumber(phoneNumber)}`,
    );
    await updateNotificationStatus(
      id,
      notificationType,
      false,
      "Telefone inválido no cadastro",
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

  // 4. Pedir o envio ao whatsapp-ai (templates aprovados, mesmo número). A
  // proteção DEV fica em sendWhatsAppTemplate, que vale para todo envio.
  console.log(
    `[${notificationType}] Enviando lembrete para ${name} (${maskPhoneNumber(formattedPhone)})`,
  );

  // A validade entra no id: depois de uma renovação, o próximo ciclo é outro
  // envio — e rodar o cron duas vezes no mesmo dia não manda duas vezes.
  const ciclo = dayjs(expirationDate)
    .tz("America/Sao_Paulo")
    .format("YYYY-MM-DD");

  const result = await sendWhatsAppTemplate({
    externalId: `${notificationType}:${id}:${ciclo}`,
    phoneNumber: formattedPhone,
    patientName: name,
    category: CATEGORY[notificationType],
    templateName: templateConfig.name,
    language: templateConfig.language,
    parameters: templateConfig.parameters,
  });

  // 5. Atualizar status no banco. Pulado (descadastro no atendimento) conta
  // como não enviado: o paciente não recebeu, e não adianta tentar de novo.
  // Falha passageira libera a trava para a próxima execução recuperar.
  const sent = result.success && result.status === "queued";
  if (!result.success && result.retryable) {
    await releaseNotificationLock(id, notificationType);
  } else {
    await updateNotificationStatus(
      id,
      notificationType,
      sent,
      !result.success
        ? result.error
        : sent
          ? null
          : `Pulado pelo atendimento: ${result.reason}`,
    );
  }

  return {
    patientId: id,
    patientName: name,
    phone: maskPhoneNumber(formattedPhone),
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
  send: ReminderSend,
): Promise<number> {
  console.log(`\n========================================`);
  console.log(`[${type}] Iniciando processamento`);
  console.log(`========================================\n`);

  try {
    // 1. Buscar pacientes elegíveis
    const patients = await getEligiblePatients();

    if (patients.length === 0) {
      console.log(`[${type}] Nenhum paciente elegível encontrado`);
      return 0;
    }

    console.log(`[${type}] ${patients.length} pacientes elegíveis encontrados`);

    // 2. Processar cada paciente
    const results: ProcessingResult[] = [];

    for (const patient of patients) {
      try {
        const result = await processPatient(patient, type, send);
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

    return results.length;
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
 * 4. D+30 (venceu há 30 dias ou mais)
 *    O D0 atrasado e o D+30 dividem o teto diário de vencidos.
 *
 * Uso:
 * - Pode ser chamada manualmente: await runWhatsAppRenewalCron()
 * - Ou configurada em um cron job externo (Vercel Cron, node-cron, etc)
 */
export type CronOutcome = { executed: boolean; reason?: string };

export async function runWhatsAppRenewalCron({
  force = false,
}: {
  /** Ignora hora, dia e "já disparou hoje" — para rodar à mão. */
  force?: boolean;
} = {}): Promise<CronOutcome> {
  const settings = await getWhatsAppSettings();

  if (!settings.enabled) {
    console.log(
      "⚠️  Envios de WhatsApp desligados em /whatsapp. Cron abortado.",
    );
    return { executed: false, reason: "envios desligados" };
  }

  if (!force) {
    const decision = await claimScheduledRun(settings);
    if (!decision.run) {
      // Silencioso de propósito: o crontab chama de hora em hora, e 23 linhas
      // por dia de "não é a hora" esconderiam a que importa no log.
      return { executed: false, reason: decision.reason };
    }
  }

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     CRON: Lembretes de Renovação via WhatsApp         ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  console.log(
    `Executado em: ${dayjs().tz("America/Sao_Paulo").format("DD/MM/YYYY HH:mm:ss")} (SP)` +
      (force ? " — forçado" : ""),
  );

  const startTime = Date.now();
  const { officialNumber } = settings;
  // Uma leitura por execução: todos os pacientes de um lembrete saem com o
  // mesmo modelo, mesmo que alguém o troque na tela no meio do disparo.
  const templates = await getMessageTemplates();

  // O D0 atrasado e o D+30 drenam o passivo de vencidos e dividem um só teto
  // por execução: a Meta entrega poucas conversas por dia, e a que ela recusa
  // já ficou gravada como enviada — não volta na fila.
  let overdueBudget = settings.overdueDailyLimit;

  const etapas: Array<{
    type: RenewalType;
    enabled: boolean;
    /** Parte do teto de vencidos: sem saldo, a etapa nem consulta. */
    isOverdue?: boolean;
    find: () => Promise<EligiblePatient[]>;
  }> = [
    {
      type: "RENEWAL_D_7",
      enabled: settings.reminderD7Enabled,
      find: () => getEligiblePatientsForD7(settings.d7DailyLimit),
    },
    {
      type: "RENEWAL_D_0",
      enabled: settings.reminderD0Enabled,
      find: getEligiblePatientsForD0,
    },
    {
      type: "RENEWAL_D_0_LATE",
      enabled: settings.reminderD0LateEnabled,
      isOverdue: true,
      find: () => getEligiblePatientsForD0Late(overdueBudget),
    },
    {
      type: "RENEWAL_D_30",
      enabled: settings.reminderD30Enabled,
      isOverdue: true,
      find: () => getEligiblePatientsForD30(overdueBudget),
    },
  ];

  try {
    for (const etapa of etapas) {
      if (!etapa.enabled) {
        console.log(`\n[${etapa.type}] Desligado em /whatsapp`);
        continue;
      }
      if (etapa.isOverdue && overdueBudget <= 0) {
        console.log(`\n[${etapa.type}] Teto diário de vencidos já usado`);
        continue;
      }
      const processed = await processRenewalType(etapa.type, etapa.find, {
        template: templates[MESSAGE_KEY[etapa.type]],
        officialNumber,
      });
      if (etapa.isOverdue) overdueBudget -= processed;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║            CRON FINALIZADO COM SUCESSO                ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log(`Tempo total: ${duration}s`);
    console.log("\n");
    return { executed: true };
  } catch (error) {
    console.error("\n❌ ERRO CRÍTICO NO CRON:", error);
    throw error;
  }
}

/**
 * Execução pelo crontab (run-cron.sh), de hora em hora.
 * Para disparar agora, fora do horário: npx tsx src/cron/whatsapp-renewal-cron.ts --agora
 */
if (require.main === module) {
  runWhatsAppRenewalCron({ force: process.argv.includes("--agora") })
    .then((outcome) => {
      if (outcome.executed) console.log("✅ Cron executado com sucesso");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro ao executar cron:", error);
      process.exit(1);
    });
}
