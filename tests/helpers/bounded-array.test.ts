import { describe, expect, it } from "vitest";
import { z } from "zod";

import { saveMessageTemplateSchema } from "@/actions/save-message-template/schema";
import { upsertWhatsAppSettingsSchema } from "@/actions/upsert-whatsapp-settings/schema";
import { boundedArray } from "@/helpers/bounded-array";

const days = boundedArray(
  z.array(z.number().int().min(0).max(6)).min(1, { message: "Escolha um dia" }),
  7,
);

describe("boundedArray", () => {
  it("aceita a lista dentro do teto", () => {
    expect(days.parse([1, 3, 5])).toEqual([1, 3, 5]);
  });

  it("continua validando os itens e as regras do array", () => {
    expect(days.safeParse([9]).success).toBe(false);
    expect(days.safeParse([]).error?.issues[0].message).toBe("Escolha um dia");
  });

  it("barra a lista enorme com um erro só, sem validar item por item", () => {
    // Itens inválidos: sem o teto, seria um erro por item (meio milhão)
    const result = days.safeParse(new Array(500_000).fill("x"));

    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0]).toMatchObject({
      code: "too_big",
      maximum: 7,
      message: "No máximo 7 itens",
    });
  });
});

describe("schemas das Server Actions", () => {
  it("as configurações do WhatsApp barram sendDays gigante", () => {
    const result = upsertWhatsAppSettingsSchema.safeParse({
      sendDays: new Array(100_000).fill("x"),
    });

    const sendDaysIssues = result.error?.issues.filter(
      (issue) => issue.path[0] === "sendDays",
    );
    expect(sendDaysIssues).toHaveLength(1);
  });

  it("o modelo de mensagem barra params gigante", () => {
    const result = saveMessageTemplateSchema.safeParse({
      params: new Array(100_000).fill({ source: "inexistente" }),
    });

    const paramsIssues = result.error?.issues.filter(
      (issue) => issue.path[0] === "params",
    );
    expect(paramsIssues).toHaveLength(1);
  });
});
