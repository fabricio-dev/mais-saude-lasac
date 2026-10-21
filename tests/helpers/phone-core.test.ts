import { describe, expect, it } from "vitest";

import { mesmoTelefone, nucleoTelefone } from "@/helpers/phone-core";

describe("nucleoTelefone", () => {
  it("fica com DDD e os 8 dígitos finais", () => {
    expect(nucleoTelefone("87991372728")).toEqual({
      ddd: "87",
      final: "91372728",
    });
  });

  it("ignora máscara e o 55 do WhatsApp", () => {
    expect(nucleoTelefone("+55 (87) 99137-2728")).toEqual({
      ddd: "87",
      final: "91372728",
    });
  });

  it("não forma núcleo com menos de 10 dígitos", () => {
    expect(nucleoTelefone("991372728")).toBeNull();
  });
});

describe("mesmoTelefone", () => {
  const comNono = nucleoTelefone("87991372728")!;

  it.each(["8791372728", "5587991372728", "558791372728", "(87) 99137-2728"])(
    "trata %s como o mesmo número",
    (outro) => {
      expect(mesmoTelefone(comNono, nucleoTelefone(outro))).toBe(true);
    },
  );

  it("diferencia o mesmo final em outro DDD", () => {
    expect(mesmoTelefone(comNono, nucleoTelefone("11991372728"))).toBe(false);
  });

  it("não casa com telefone sem núcleo", () => {
    expect(mesmoTelefone(comNono, null)).toBe(false);
  });
});
