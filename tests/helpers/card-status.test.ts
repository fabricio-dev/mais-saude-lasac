import { describe, expect, it } from "vitest";

import { situacaoDoCartao } from "@/helpers/card-status";

describe("situacaoDoCartao", () => {
  it("vale o último dia inteiro, até 23h59 em São Paulo", () => {
    // 29/10 às 15h em São Paulo: o caso que dizia "vencido — validade 29/10".
    expect(
      situacaoDoCartao("2026-10-29", new Date("2026-10-29T18:00:00Z")),
    ).toBe("ativo");
    expect(
      situacaoDoCartao("2026-10-29", new Date("2026-10-30T02:59:00Z")),
    ).toBe("ativo");
  });

  it("vence na virada do dia em São Paulo, não na de UTC", () => {
    // 30/10 às 00h01 em São Paulo (03h01 UTC).
    expect(
      situacaoDoCartao("2026-10-29", new Date("2026-10-30T03:01:00Z")),
    ).toBe("vencido");
  });

  it("continua ativo antes do último dia", () => {
    expect(
      situacaoDoCartao("2027-08-18", new Date("2026-11-07T13:45:00Z")),
    ).toBe("ativo");
  });

  it("sem validade não tem situação", () => {
    expect(situacaoDoCartao(null)).toBeNull();
  });
});
