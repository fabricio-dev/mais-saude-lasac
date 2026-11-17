import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { patientsTable } from "@/db/schema";
import { cpfDoCadastroIgual } from "@/helpers/cpf-do-cadastro";

describe("cpfDoCadastroIgual", () => {
  const consulta = new PgDialect().sqlToQuery(
    cpfDoCadastroIgual(patientsTable.cpfNumber, "09331575416"),
  );

  it("tira a pontuação da coluna antes de comparar", () => {
    expect(consulta.sql).toContain(
      `regexp_replace("patients"."cpf_number", '[^0-9]', '', 'g') =`,
    );
  });

  it("compara com os dígitos que vieram, como parâmetro", () => {
    expect(consulta.params).toEqual(["09331575416"]);
  });
});
