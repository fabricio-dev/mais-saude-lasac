import { describe, expect, it } from "vitest";

import {
  buildContactsCsv,
  expiredContactsFileName,
  formatPhoneForSpreadsheet,
} from "@/helpers/contacts-csv";

describe("formatPhoneForSpreadsheet", () => {
  it.each([
    ["87991372728", "(87) 99137-2728"],
    ["(87) 99137-2728", "(87) 99137-2728"],
    ["5587991372728", "(87) 99137-2728"],
    ["+55 87 99137-2728", "(87) 99137-2728"],
    ["8791372728", "(87) 9137-2728"],
    ["558791372728", "(87) 9137-2728"],
    // DDD 55 (RS) sem código do país não perde o DDD
    ["55991372728", "(55) 99137-2728"],
  ])("formata %s como %s", (bruto, esperado) => {
    expect(formatPhoneForSpreadsheet(bruto)).toBe(esperado);
  });

  it.each(["", "00000000000", "(00) 00000-0000", "991372728", "abc"])(
    "deixa em branco o telefone inválido %j",
    (bruto) => {
      expect(formatPhoneForSpreadsheet(bruto)).toBe("");
    },
  );
});

describe("buildContactsCsv", () => {
  it("começa com BOM, usa ; e CRLF, telefone antes do nome", () => {
    const csv = buildContactsCsv([
      { name: "José da Silva", phoneNumber: "87991372728" },
      { name: "Maria", phoneNumber: "8791372728" },
    ]);

    expect(csv).toBe(
      "﻿telefone;nome\r\n" +
        "(87) 99137-2728;José da Silva\r\n" +
        "(87) 9137-2728;Maria\r\n",
    );
  });

  it("põe aspas no campo com separador, aspas ou quebra de linha", () => {
    const csv = buildContactsCsv([
      { name: 'Ana; "Aninha"\nSouza', phoneNumber: "87991372728" },
    ]);

    expect(csv.split("\r\n")[1]).toBe(
      '(87) 99137-2728;"Ana; ""Aninha""\nSouza"',
    );
  });

  it("não deixa o nome virar fórmula no Excel", () => {
    const csv = buildContactsCsv([
      { name: "=HYPERLINK(1)", phoneNumber: "87991372728" },
    ]);

    expect(csv.split("\r\n")[1]).toBe("(87) 99137-2728;'=HYPERLINK(1)");
  });

  it("só o cabeçalho quando não há contatos", () => {
    expect(buildContactsCsv([])).toBe("﻿telefone;nome\r\n");
  });
});

describe("expiredContactsFileName", () => {
  it("usa o dia de São Paulo, sem barras", () => {
    // 02:30 UTC de 18/11 ainda é 17/11 em São Paulo
    expect(expiredContactsFileName(new Date("2026-11-18T02:30:00Z"))).toBe(
      "todos_cartao_vencidos_17-11-2026.csv",
    );
  });
});
