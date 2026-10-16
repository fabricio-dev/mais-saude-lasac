import {
  fake,
  resetFakes,
  setWhatsAppEnv,
  TEST_PHONE,
} from "@tests/fakes/whatsapp-fakes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";

vi.mock(
  "@/data/whatsapp-settings",
  () => import("@tests/fakes/whatsapp-fakes"),
);
vi.mock(
  "@/data/whatsapp-connection",
  () => import("@tests/fakes/whatsapp-fakes"),
);

const PATIENT_PHONE = "87991234567";

const send = () =>
  sendWhatsAppTemplate({
    externalId: "activation:p1:2027-10-16",
    phoneNumber: PATIENT_PHONE,
    patientName: "Maria",
    category: "Convênio ativado",
    templateName: "convenio_ativado",
    parameters: ["Maria"],
  });

beforeEach(resetFakes);

describe("sendWhatsAppTemplate — proteção DEV", () => {
  it("sem WHATSAPP_ENV, com telefone de teste: redireciona", async () => {
    setWhatsAppEnv({ testPhone: TEST_PHONE });
    const result = await send();

    expect(result.success).toBe(true);
    expect(fake.requests[0].body.to).toBe(TEST_PHONE);
  });

  it("dev com telefone de teste: redireciona", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    await send();

    expect(fake.requests[0].body.to).toBe(TEST_PHONE);
  });

  it("dev sem telefone de teste: vai para o paciente", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev" });
    await send();

    expect(fake.requests[0].body.to).toBe(PATIENT_PHONE);
  });

  it("prod: vai para o paciente, mesmo com telefone de teste", async () => {
    setWhatsAppEnv({ whatsappEnv: "prod", testPhone: TEST_PHONE });
    await send();

    expect(fake.requests[0].body.to).toBe(PATIENT_PHONE);
  });

  it("envios desligados: nada sai", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.settings.enabled = false;
    const result = await send();

    expect(result.success).toBe(false);
    expect(fake.requests).toHaveLength(0);
  });

  it("só o destino muda: o resto do pedido segue igual", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    await send();

    expect(fake.requests[0]).toEqual({
      url: "https://whatsapp-ai.test/api/integrations/v1/messages",
      body: {
        externalId: "activation:p1:2027-10-16",
        to: TEST_PHONE,
        name: "Maria",
        category: "Convênio ativado",
        template: {
          name: "convenio_ativado",
          language: "pt_BR",
          params: ["Maria"],
        },
      },
    });
  });
});
