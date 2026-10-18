import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq, isNull, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { whatsappSettingsTable } from "@/db/schema";

dayjs.extend(utc);
dayjs.extend(timezone);

const SETTINGS_ID = "default";
const TIMEZONE = "America/Sao_Paulo";

export type WhatsAppSettings = {
  enabled: boolean;
  reminderD7Enabled: boolean;
  reminderD0Enabled: boolean;
  reminderD0LateEnabled: boolean;
  reminderD30Enabled: boolean;
  overdueDailyLimit: number;
  officialNumber: string | null;
  sendHour: number;
  sendDays: number[];
  lastRunOn: string | null;
  updatedAt: Date | null;
  /** Ainda não foi salva pela tela: os valores vêm do .env. */
  isDefault: boolean;
};

/**
 * Padrões enquanto ninguém salvou a tela: os mesmos do .env que o sistema já
 * usava, para a troca não mudar nada no dia do deploy.
 */
function defaultsFromEnv(): WhatsAppSettings {
  return {
    enabled: process.env.WHATSAPP_ENABLED === "true",
    reminderD7Enabled: true,
    reminderD0Enabled: true,
    reminderD0LateEnabled: process.env.WHATSAPP_D0_LATE_ENABLED === "true",
    reminderD30Enabled: true,
    overdueDailyLimit:
      Number.parseInt(process.env.WHATSAPP_D30_DAILY_LIMIT ?? "", 10) || 100,
    officialNumber: process.env.WHATSAPP_OFFICIAL_NUMBER?.trim() || null,
    sendHour: 9,
    sendDays: [0, 1, 2, 3, 4, 5, 6],
    lastRunOn: null,
    updatedAt: null,
    isDefault: true,
  };
}

export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const row = await db.query.whatsappSettingsTable.findFirst({
    where: eq(whatsappSettingsTable.id, SETTINGS_ID),
  });
  if (!row) return defaultsFromEnv();

  return {
    enabled: row.enabled,
    reminderD7Enabled: row.reminderD7Enabled,
    reminderD0Enabled: row.reminderD0Enabled,
    reminderD0LateEnabled: row.reminderD0LateEnabled,
    reminderD30Enabled: row.reminderD30Enabled,
    overdueDailyLimit: row.overdueDailyLimit,
    officialNumber: row.officialNumber,
    sendHour: row.sendHour,
    sendDays: row.sendDays,
    lastRunOn: row.lastRunOn,
    updatedAt: row.updatedAt,
    isDefault: false,
  };
}

export type WhatsAppSettingsInput = Omit<
  WhatsAppSettings,
  "lastRunOn" | "updatedAt" | "isDefault"
>;

/** Só os campos editáveis — o que a tela salva. */
export function toInput(settings: WhatsAppSettings): WhatsAppSettingsInput {
  return {
    enabled: settings.enabled,
    reminderD7Enabled: settings.reminderD7Enabled,
    reminderD0Enabled: settings.reminderD0Enabled,
    reminderD0LateEnabled: settings.reminderD0LateEnabled,
    reminderD30Enabled: settings.reminderD30Enabled,
    overdueDailyLimit: settings.overdueDailyLimit,
    officialNumber: settings.officialNumber,
    sendHour: settings.sendHour,
    sendDays: settings.sendDays,
  };
}

/**
 * Garante a linha de configuração, nascendo com os valores do .env — e não com
 * os padrões da tabela, que desligariam os envios (`enabled` nasce false).
 * Quem grava só uma parte (a marca do dia, a conexão) passa por aqui antes.
 */
export async function ensureSettingsRow(): Promise<void> {
  await db
    .insert(whatsappSettingsTable)
    .values({ id: SETTINGS_ID, ...toInput(defaultsFromEnv()) })
    .onConflictDoNothing();
}

export const WHATSAPP_SETTINGS_ID = SETTINGS_ID;

export async function saveWhatsAppSettings(
  input: WhatsAppSettingsInput,
  userId: string,
): Promise<void> {
  const values = { ...input, updatedAt: new Date(), updatedByUserId: userId };

  await db
    .insert(whatsappSettingsTable)
    .values({ id: SETTINGS_ID, ...values })
    .onConflictDoUpdate({ target: whatsappSettingsTable.id, set: values });
}

/** Hoje em São Paulo, no formato da coluna `last_run_on`. */
export const todaySP = () => dayjs().tz(TIMEZONE).format("YYYY-MM-DD");

export type RunDecision = { run: true } | { run: false; reason: string };

/**
 * O cron é chamado de hora em hora; isto decide se esta chamada dispara.
 *
 * Dispara na primeira chamada a partir da hora escolhida, num dia permitido, e
 * uma vez por dia: a marca do dia é gravada **antes** de processar, num update
 * condicional — duas chamadas simultâneas não disparam as duas. Se o processo
 * cair no meio, o dia fica marcado e quem ficou para trás é recuperado pelas
 * janelas dos lembretes no dia seguinte.
 */
export async function claimScheduledRun(
  settings: WhatsAppSettings,
): Promise<RunDecision> {
  const now = dayjs().tz(TIMEZONE);
  const today = now.format("YYYY-MM-DD");

  if (!settings.enabled) return { run: false, reason: "envios desligados" };
  if (!settings.sendDays.includes(now.day())) {
    return { run: false, reason: "hoje não é dia de disparo" };
  }
  if (now.hour() < settings.sendHour) {
    return {
      run: false,
      reason: `ainda não são ${String(settings.sendHour).padStart(2, "0")}h`,
    };
  }
  if (settings.lastRunOn === today) {
    return { run: false, reason: "já disparou hoje" };
  }

  // Sem linha salva (padrões do .env), cria a linha para guardar a marca.
  if (settings.isDefault) await ensureSettingsRow();

  const claimed = await db
    .update(whatsappSettingsTable)
    .set({ lastRunOn: today })
    .where(
      and(
        eq(whatsappSettingsTable.id, SETTINGS_ID),
        or(
          isNull(whatsappSettingsTable.lastRunOn),
          ne(whatsappSettingsTable.lastRunOn, today),
        ),
      ),
    )
    .returning({ id: whatsappSettingsTable.id });

  return claimed.length > 0
    ? { run: true }
    : { run: false, reason: "outra chamada já disparou hoje" };
}
