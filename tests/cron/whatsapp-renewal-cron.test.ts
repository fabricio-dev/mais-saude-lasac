import {
  dbCallsOf,
  fake,
  resetFakes,
  setWhatsAppEnv,
  TEST_PHONE,
} from "@tests/fakes/whatsapp-fakes";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runWhatsAppRenewalCron } from "@/cron/whatsapp-renewal-cron";

vi.mock("@/db", () => import("@tests/fakes/whatsapp-fakes"));
vi.mock(
  "@/data/whatsapp-settings",
  () => import("@tests/fakes/whatsapp-fakes"),
);
vi.mock(
  "@/data/whatsapp-connection",
  () => import("@tests/fakes/whatsapp-fakes"),
);
vi.mock(
  "@/data/whatsapp-message-templates",
  () => import("@tests/fakes/whatsapp-fakes"),
);

const patient = (phoneNumber = "87991234567") => ({
  id: "p1",
  name: "Maria Souza",
  phoneNumber,
  expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  clinicId: "c1",
  clinicName: "Clínica X",
  whatsappConsent: true,
});

/** Roda forçado e pula a pausa de 1s entre pacientes. */
async function runCron() {
  const outcome = runWhatsAppRenewalCron({ force: true });
  await vi.runAllTimersAsync();
  return outcome;
}

beforeEach(() => {
  resetFakes();
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("cron de lembretes — D-7", () => {
  it("dev: vai para o número de teste, e a trava fica como enviada", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.patients = [patient()];
    const outcome = await runCron();

    expect(outcome.executed).toBe(true);
    expect(fake.requests).toHaveLength(1);
    const { body } = fake.requests[0];
    expect(body.to).toBe(TEST_PHONE);
    expect(body.externalId).toMatch(/^RENEWAL_D_7:p1:\d{4}-\d{2}-\d{2}$/);
    expect(body.category).toBe("Vencimento em 7 dias");
    expect(body.template.name).toBe("lembrete_vencimento_7_dias");
    expect(dbCallsOf("insert", "values")[0].args[0]).toMatchObject({
      status: "pending",
    });
    expect(dbCallsOf("update", "set")[0].args[0]).toMatchObject({
      status: "sent",
    });
  });

  it("prod: vai para o paciente, com o 55 na frente", async () => {
    setWhatsAppEnv({ whatsappEnv: "prod", testPhone: TEST_PHONE });
    fake.patients = [patient()];
    await runCron();

    expect(fake.requests[0].body.to).toBe("5587991234567");
  });

  it("telefone inválido: nada sai, e fica como falha", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.patients = [patient("123")];
    vi.spyOn(console, "error").mockImplementation(() => {});
    await runCron();

    expect(fake.requests).toHaveLength(0);
    expect(dbCallsOf("update", "set")[0].args[0]).toMatchObject({
      status: "failed",
      failureReason: "Telefone inválido no cadastro",
    });
  });

  it("falha que se resolve com correção: a trava é desfeita", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.patients = [patient()];
    fake.response = {
      status: 422,
      body: { error: "template_unavailable", message: "Modelo pausado." },
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    await runCron();

    expect(fake.requests).toHaveLength(1);
    expect(dbCallsOf("delete", "where")).toHaveLength(1);
    expect(dbCallsOf("update", "set")).toHaveLength(0);
  });

  it("pulado pelo atendimento: fica como falha, com o motivo", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.patients = [patient()];
    fake.response = {
      status: 200,
      body: {
        id: "e1",
        status: "skipped",
        reason: "opted_out",
        duplicate: false,
      },
    };
    await runCron();

    expect(dbCallsOf("update", "set")[0].args[0]).toMatchObject({
      status: "failed",
      failureReason: "Pulado pelo atendimento: opted_out",
    });
  });

  it("envios desligados: o cron não roda", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.settings.enabled = false;
    fake.patients = [patient()];
    const outcome = await runCron();

    expect(outcome.executed).toBe(false);
    expect(fake.requests).toHaveLength(0);
  });
});

describe("cron de lembretes — teto de vencidos", () => {
  const limitsAsked = () =>
    dbCallsOf("select", "limit").map((call) => call.args[0]);

  beforeEach(() => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.settings.reminderD7Enabled = false;
    fake.settings.reminderD0LateEnabled = true;
    fake.settings.reminderD30Enabled = true;
    fake.patients = [patient(), { ...patient(), id: "p2" }];
  });

  it("o D+30 recebe só o que sobrou do D0 atrasado", async () => {
    fake.settings.overdueDailyLimit = 3;
    await runCron();

    expect(limitsAsked()).toEqual([3, 1]);
  });

  it("teto usado pelo D0 atrasado: o D+30 nem consulta", async () => {
    fake.settings.overdueDailyLimit = 2;
    await runCron();

    expect(limitsAsked()).toEqual([2]);
    expect(
      fake.requests.every((r) =>
        r.body.externalId.startsWith("RENEWAL_D_0_LATE"),
      ),
    ).toBe(true);
  });
});

describe("cron de lembretes — teto do D-7", () => {
  const callsOf = (method: string) =>
    dbCallsOf("select", method).map((call) => call.args[0]);

  beforeEach(() => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.patients = [patient()];
  });

  it("pede ao banco só o teto do D-7", async () => {
    fake.settings.d7DailyLimit = 40;
    await runCron();

    expect(callsOf("limit")).toEqual([40]);
  });

  it("o D-7 não divide o teto com os vencidos", async () => {
    fake.settings.d7DailyLimit = 40;
    fake.settings.overdueDailyLimit = 100;
    fake.settings.reminderD0LateEnabled = true;
    fake.settings.reminderD30Enabled = true;
    await runCron();

    expect(callsOf("limit")).toEqual([40, 100, 99]);
  });

  it("quem vence antes sai antes: ordem crescente de vencimento", async () => {
    await runCron();

    const [order] = callsOf("orderBy") as SQL[];
    const { sql } = new PgDialect().sqlToQuery(order);
    expect(sql).toMatch(/ asc$/);
  });
});
