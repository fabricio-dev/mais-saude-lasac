import { randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import {
  ensureSettingsRow,
  WHATSAPP_SETTINGS_ID,
} from "@/data/whatsapp-settings";
import { db } from "@/db";
import { whatsappSettingsTable } from "@/db/schema";
import {
  decryptSecret,
  encryptSecret,
  hashSecret,
  maskSecret,
  sameHash,
} from "@/lib/crypto";

/**
 * Conexão com o sistema de atendimento (whatsapp-ai), editada em /whatsapp.
 *
 * Os segredos não passam pelo `WhatsAppSettings`, que vai para a tela: aqui é
 * o único lugar que os lê. Enquanto nada foi salvo pela tela, valem os do .env
 * (WHATSAPP_AI_URL, WHATSAPP_AI_API_KEY, INTEGRATION_API_KEY).
 */

const INTEGRATION_KEY_PREFIX = "msl_";

async function readRow() {
  const [row] = await db
    .select({
      whatsappAiUrl: whatsappSettingsTable.whatsappAiUrl,
      whatsappAiApiKeyEncrypted:
        whatsappSettingsTable.whatsappAiApiKeyEncrypted,
      integrationApiKeyHash: whatsappSettingsTable.integrationApiKeyHash,
      integrationApiKeyPrefix: whatsappSettingsTable.integrationApiKeyPrefix,
      integrationApiKeyCreatedAt:
        whatsappSettingsTable.integrationApiKeyCreatedAt,
    })
    .from(whatsappSettingsTable)
    .where(eq(whatsappSettingsTable.id, WHATSAPP_SETTINGS_ID));
  return row ?? null;
}

const envUrl = () => process.env.WHATSAPP_AI_URL?.trim() || null;
const envApiKey = () => process.env.WHATSAPP_AI_API_KEY?.trim() || null;
const envIntegrationKey = () => process.env.INTEGRATION_API_KEY?.trim() || null;

/** O que a tela mostra: nunca um segredo inteiro. */
export type WhatsAppConnectionView = {
  url: string | null;
  urlFromEnv: boolean;
  apiKeyMasked: string | null;
  apiKeyFromEnv: boolean;
  integrationKeyPrefix: string | null;
  integrationKeyCreatedAt: Date | null;
  integrationKeyFromEnv: boolean;
  /** SETTINGS_ENCRYPTION_KEY presente: sem ela, a chave não pode ser salva. */
  encryptionConfigured: boolean;
};

export async function getWhatsAppConnectionView(): Promise<WhatsAppConnectionView> {
  const row = await readRow();

  let apiKeyMasked: string | null = null;
  if (row?.whatsappAiApiKeyEncrypted) {
    try {
      apiKeyMasked = maskSecret(decryptSecret(row.whatsappAiApiKeyEncrypted));
    } catch {
      apiKeyMasked = "não foi possível ler — cole a chave de novo";
    }
  } else if (envApiKey()) {
    apiKeyMasked = maskSecret(envApiKey()!);
  }

  return {
    url: row?.whatsappAiUrl ?? envUrl(),
    urlFromEnv: !row?.whatsappAiUrl && Boolean(envUrl()),
    apiKeyMasked,
    apiKeyFromEnv: !row?.whatsappAiApiKeyEncrypted && Boolean(envApiKey()),
    integrationKeyPrefix: row?.integrationApiKeyHash
      ? row.integrationApiKeyPrefix
      : envIntegrationKey()
        ? maskSecret(envIntegrationKey()!)
        : null,
    integrationKeyCreatedAt: row?.integrationApiKeyCreatedAt ?? null,
    integrationKeyFromEnv:
      !row?.integrationApiKeyHash && Boolean(envIntegrationKey()),
    encryptionConfigured: Boolean(process.env.SETTINGS_ENCRYPTION_KEY),
  };
}

/** URL e chave para o envio. Só servidor. */
export async function getWhatsAppAiCredentials(): Promise<{
  url: string;
  apiKey: string;
} | null> {
  const row = await readRow();
  const url = (row?.whatsappAiUrl ?? envUrl())?.replace(/\/+$/, "");
  const apiKey = row?.whatsappAiApiKeyEncrypted
    ? decryptSecret(row.whatsappAiApiKeyEncrypted)
    : envApiKey();

  return url && apiKey ? { url, apiKey } : null;
}

/**
 * Salva a URL e, quando veio, a chave. Chave em branco mantém a gravada — a
 * tela nunca recebe a chave de volta para reenviar.
 */
export async function saveWhatsAppAiConnection(
  input: { url: string; apiKey?: string },
  userId: string,
): Promise<void> {
  await ensureSettingsRow();
  await db
    .update(whatsappSettingsTable)
    .set({
      whatsappAiUrl: input.url.replace(/\/+$/, ""),
      ...(input.apiKey
        ? { whatsappAiApiKeyEncrypted: encryptSecret(input.apiKey) }
        : {}),
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(whatsappSettingsTable.id, WHATSAPP_SETTINGS_ID));
}

/**
 * Gera a chave da consulta de cartão e devolve o valor inteiro — a única vez
 * em que ele existe fora do whatsapp-ai. A anterior para de valer na hora.
 */
export async function generateIntegrationApiKey(
  userId: string,
): Promise<string> {
  const rawKey = `${INTEGRATION_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;

  await ensureSettingsRow();
  await db
    .update(whatsappSettingsTable)
    .set({
      integrationApiKeyHash: hashSecret(rawKey),
      integrationApiKeyPrefix: `${rawKey.slice(0, INTEGRATION_KEY_PREFIX.length + 6)}…`,
      integrationApiKeyCreatedAt: new Date(),
      updatedAt: new Date(),
      updatedByUserId: userId,
    })
    .where(eq(whatsappSettingsTable.id, WHATSAPP_SETTINGS_ID));

  return rawKey;
}

/**
 * Confere a chave que o whatsapp-ai mandou. Com chave gerada pela tela, só ela
 * vale; antes disso, a do .env.
 */
export async function verifyIntegrationApiKey(
  received: string | null,
): Promise<boolean> {
  if (!received) return false;

  const row = await readRow();
  const expectedHash = row?.integrationApiKeyHash
    ? row.integrationApiKeyHash
    : envIntegrationKey()
      ? hashSecret(envIntegrationKey()!)
      : null;

  return expectedHash !== null && sameHash(hashSecret(received), expectedHash);
}
