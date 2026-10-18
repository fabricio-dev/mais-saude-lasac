/**
 * Substitutos do banco, das configurações e do whatsapp-ai para os testes do
 * envio por WhatsApp. Nada aqui fala com Postgres ou com a rede: o `fetch`
 * registra o pedido que iria para o whatsapp-ai, e o `db` registra as chamadas
 * do drizzle.
 *
 * Um módulo só faz o papel de vários (`@/db`, `@/data/whatsapp-settings`...):
 * cada teste aponta o `vi.mock` de cada um para cá.
 */

import { vi } from "vitest";

import type { WhatsAppSettings } from "@/data/whatsapp-settings";
import {
  DEFAULT_MESSAGE_TEMPLATES,
  type MessageKey,
  type MessageTemplateConfig,
} from "@/lib/whatsapp/message-templates";

export const TEST_PHONE = "5511900000000";

type DbCall = { kind: string; method: string; args: unknown[] };
/** O corpo do POST /api/integrations/v1/messages (src/lib/whatsapp/client.ts). */
type SentBody = {
  externalId: string;
  to: string;
  name?: string;
  category?: string;
  template: { name: string; language: string; params: string[] };
  header?: { type: string; link: string; filename?: string };
};
type SentRequest = { url: string; body: SentBody };

export const fake = {
  settings: {} as Partial<WhatsAppSettings>,
  templates: {} as Record<MessageKey, MessageTemplateConfig>,
  patients: [] as unknown[],
  dbCalls: [] as DbCall[],
  requests: [] as SentRequest[],
  response: { status: 202, body: {} as unknown },
};

export const queued = {
  id: "envio-1",
  status: "queued",
  reason: null,
  duplicate: false,
};

/** Estado limpo: envios ligados, só o D-7 ativo, whatsapp-ai aceitando tudo. */
export function resetFakes() {
  fake.settings = {
    enabled: true,
    officialNumber: null,
    reminderD7Enabled: true,
    reminderD0Enabled: false,
    reminderD0LateEnabled: false,
    reminderD30Enabled: false,
    d7DailyLimit: 40,
    overdueDailyLimit: 100,
  };
  fake.templates = structuredClone(DEFAULT_MESSAGE_TEMPLATES);
  fake.patients = [];
  fake.dbCalls = [];
  fake.requests = [];
  fake.response = { status: 202, body: queued };

  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    fake.requests.push({ url, body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify(fake.response.body), {
      status: fake.response.status,
    });
  });
}

/** `WHATSAPP_ENV` e `WHATSAPP_TEST_PHONE` deste teste; ausente é ausente. */
export function setWhatsAppEnv(env: {
  whatsappEnv?: string;
  testPhone?: string;
}) {
  vi.stubEnv("WHATSAPP_ENV", env.whatsappEnv);
  vi.stubEnv("WHATSAPP_TEST_PHONE", env.testPhone);
}

/** As chamadas do drizzle de um tipo, por método: `dbCallsOf("update", "set")`. */
export const dbCallsOf = (kind: string, method: string) =>
  fake.dbCalls.filter((call) => call.kind === kind && call.method === method);

// ─── @/data/whatsapp-settings ───────────────────────────────────────────────

export async function getWhatsAppSettings() {
  return fake.settings;
}

export async function claimScheduledRun() {
  return { run: true };
}

// ─── @/data/whatsapp-connection ─────────────────────────────────────────────

export async function getWhatsAppAiCredentials() {
  return { url: "https://whatsapp-ai.test", apiKey: "chave-de-teste" };
}

// ─── @/data/whatsapp-message-templates ──────────────────────────────────────

export async function getMessageTemplates() {
  return fake.templates;
}

// ─── @/data/partners-list-file ──────────────────────────────────────────────

export const PARTNERS_LIST_PATH = "/arquivos/lista-de-parceiros.pdf";

// ─── @/db ───────────────────────────────────────────────────────────────────

/** Uma cadeia do drizzle que aceita qualquer método e resolve em `result`. */
function chain(kind: string, result: () => unknown): unknown {
  return new Proxy(function () {}, {
    get(_target, method) {
      if (method === "then") {
        return (
          resolve: (value: unknown) => unknown,
          reject: (reason: unknown) => unknown,
        ) => Promise.resolve().then(result).then(resolve, reject);
      }
      return (...args: unknown[]) => {
        fake.dbCalls.push({ kind, method: String(method), args });
        return chain(kind, result);
      };
    },
  });
}

export const db = {
  select: () => chain("select", () => fake.patients),
  insert: () => chain("insert", () => []),
  update: () => chain("update", () => []),
  delete: () => chain("delete", () => []),
};
