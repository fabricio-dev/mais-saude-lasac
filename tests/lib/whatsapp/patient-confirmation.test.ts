import {
  fake,
  resetFakes,
  setWhatsAppEnv,
  TEST_PHONE,
} from "@tests/fakes/whatsapp-fakes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/whatsapp/message-templates";
import {
  type ConfirmationType,
  sendPatientConfirmation,
} from "@/lib/whatsapp/patient-confirmation";

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
vi.mock(
  "@/data/partners-list-file",
  () => import("@tests/fakes/whatsapp-fakes"),
);

const PATIENT_PHONE = "87991234567";

const confirm = (type: ConfirmationType) =>
  sendPatientConfirmation({
    patientId: "p1",
    patientName: "Maria Souza",
    phoneNumber: PATIENT_PHONE,
    type,
    expirationDate: new Date("2027-10-16T15:00:00Z"),
    clinicName: "Clínica X",
  });

beforeEach(resetFakes);

describe("sendPatientConfirmation", () => {
  it.each(["activation", "renewal", "early_renewal"] as const)(
    "%s em dev: vai para o número de teste, com o PDF no cabeçalho",
    async (type) => {
      setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
      await confirm(type);

      expect(fake.requests).toHaveLength(1);
      const { body } = fake.requests[0];
      expect(body.to).toBe(TEST_PHONE);
      expect(body.externalId).toBe(`${type}:p1:2027-10-16`);
      expect(body.template.name).toBe(
        DEFAULT_MESSAGE_TEMPLATES[type].templateName,
      );
      expect(body.template.params).toEqual([
        "Maria",
        "16/10/2027",
        "Clínica X",
      ]);
      expect(body.header).toMatchObject({
        type: "document",
        link: expect.stringMatching(/\/arquivos\/lista-de-parceiros\.pdf$/),
      });
    },
  );

  it("prod: vai para o paciente", async () => {
    setWhatsAppEnv({ whatsappEnv: "prod", testPhone: TEST_PHONE });
    await confirm("activation");

    expect(fake.requests[0].body.to).toBe(PATIENT_PHONE);
  });

  it("modelo sem documento: confirmação e lista separada, as duas redirecionadas", async () => {
    setWhatsAppEnv({ whatsappEnv: "dev", testPhone: TEST_PHONE });
    fake.templates.activation.headerDocument = false;
    await confirm("activation");

    expect(fake.requests).toHaveLength(2);
    expect(fake.requests[0].body.header).toBeUndefined();
    expect(fake.requests[1].body.externalId).toBe(
      "lista_de_parceiros:p1:2027-10-16",
    );
    for (const request of fake.requests) {
      expect(request.body.to).toBe(TEST_PHONE);
    }
  });
});
