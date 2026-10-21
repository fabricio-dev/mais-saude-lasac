import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyIntegrationApiKey } from "@/data/whatsapp-connection";
import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import {
  mesmoTelefone,
  type NucleoTelefone,
  nucleoTelefone,
} from "@/helpers/phone-core";

// Consulta de cartão para o sistema de atendimento (whatsapp-ai).
//
// Leitura mínima: nome do titular, situação e validade do convênio. Sem dado
// clínico, sem resultado de exame — quem chama é uma IA que responde ao
// paciente no WhatsApp, e o que ela não recebe ela não tem como vazar.
//
// Quem é o titular, esta rota decide; o sistema de atendimento só transporta os
// campos. São dois caminhos, e o segundo existe porque em plano de benefícios o
// dependente consulta pelo CPF do titular, de um telefone que não está no
// cadastro:
//
//   1. o telefone da conversa bate com o cadastro  → responde;
//   2. não bate                                    → exige CPF **e** data de
//      nascimento do titular, que é o que o dependente sabe e quem tem só um
//      CPF vazado não sabe.
//
// "Não encontrei" responde 200 com corpo vazio, nunca 404: do outro lado, um
// status fora da faixa 2xx é falha de rede e joga o paciente na fila humana,
// enquanto o corpo vazio faz sair o texto de não encontrado.

const VAZIO = { patient: null, agreement: null };

const consultaSchema = z.object({
  phone: z.string().min(10),
  // Opcionais na rota, obrigatórios no caminho 2. Boa parte da base não tem CPF
  // preenchido, e é por isso que a consulta por telefone continua de pé sozinha.
  document: z.string().optional(),
  birth_date: z.string().optional(),
});

const CAMPOS = {
  name: patientsTable.name,
  phoneNumber: patientsTable.phoneNumber,
  birthDate: patientsTable.birthDate,
  cardType: patientsTable.cardType,
  isActive: patientsTable.isActive,
  expirationDate: patientsTable.expirationDate,
  // Formatada no Postgres de propósito: converter no Node passaria a data por
  // fuso e moveria o vencimento um dia para trás em metade do país.
  validUntil: sql<
    string | null
  >`to_char(${patientsTable.expirationDate}, 'YYYY-MM-DD')`,
};

type Candidato = {
  name: string;
  phoneNumber: string;
  birthDate: string | null;
  cardType: "enterprise" | "personal";
  isActive: boolean;
  expirationDate: Date | null;
  validUntil: string | null;
};

/**
 * A data como o paciente digita, no formato da coluna.
 *
 * Quem preenche isso é o modelo, a partir do que a pessoa escreveu no WhatsApp,
 * e ela escreve de todo jeito: "12/05/1980", "12/5/1980", "12-05-1980",
 * "12051980" e "1980-05-12" são a mesma data. Aceitar as cinco custa uma regex
 * e evita um transbordo por dígito a menos no separador.
 *
 * O que **não** é aceito é ambiguidade real: ano com dois dígitos, ou uma
 * sequência que não fecha oito números. Aí a data não existe, e responder como
 * se existisse acertaria o cadastro de outra pessoa.
 */
function dataISO(bruto: string): string | null {
  const doisDigitos = (parte: string) => parte.padStart(2, "0");
  const texto = bruto.trim();

  const iso = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${doisDigitos(iso[2])}-${doisDigitos(iso[3])}`;

  const separada = texto.match(/^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{4})$/);
  if (separada) {
    return `${separada[3]}-${doisDigitos(separada[2])}-${doisDigitos(separada[1])}`;
  }

  const digitos = texto.replace(/\D/g, "");
  if (digitos.length !== 8) return null;

  return `${digitos.slice(4)}-${digitos.slice(2, 4)}-${digitos.slice(0, 2)}`;
}

const doMesmoNumero = (telefone: NucleoTelefone) => (candidato: Candidato) =>
  mesmoTelefone(telefone, nucleoTelefone(candidato.phoneNumber));

/// Cadastro duplicado existe; entre as linhas da mesma pessoa vale a que vence
/// por último, que é o cartão que ela tem na mão.
const maisRecente = (a: Candidato, b: Candidato) =>
  (b.expirationDate?.getTime() ?? 0) - (a.expirationDate?.getTime() ?? 0);

function resposta(paciente: Candidato) {
  const status = !paciente.isActive
    ? "inativo"
    : !paciente.expirationDate
      ? null
      : paciente.expirationDate.getTime() >= Date.now()
        ? "ativo"
        : "vencido";

  return {
    // Primeiro nome: o texto final é uma frase de WhatsApp, e nome completo no
    // vocativo fica pesado.
    patient: { name: paciente.name.trim().split(/\s+/)[0] },
    agreement: {
      status,
      // Cartão inativo carrega uma validade que não vale mais: anunciá-la sairia
      // como "está inativo — validade 20/05/2027", que se contradiz na frente
      // do paciente. Sem a data, vale o texto de não encontrado e ele fala com
      // uma pessoa, que é o desfecho certo para cartão desligado.
      validUntil: status === "inativo" ? null : paciente.validUntil,
      cardType:
        paciente.cardType === "enterprise" ? "empresarial" : "individual",
    },
  };
}

/**
 * Consulta por `POST`, apesar de ser leitura.
 *
 * O identificador vai no corpo porque query string entra no **log de acesso** —
 * do Next, do proxy, da hospedagem — e o que se leria ali é CPF e telefone de
 * paciente, guardados por quem não decidiu guardá-los. É a mesma leitura de
 * antes; o que muda é onde o dado aparece depois.
 */
export async function POST(request: NextRequest) {
  // A chave gerada em /whatsapp (só o hash fica no banco); antes de gerar
  // uma, a INTEGRATION_API_KEY do .env.
  if (!(await verifyIntegrationApiKey(request.headers.get("x-api-key")))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const corpo: unknown = await request.json().catch(() => null);
  const entrada = consultaSchema.safeParse(corpo);

  if (!entrada.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const telefone = nucleoTelefone(entrada.data.phone);
  const cpf = (entrada.data.document ?? "").replace(/\D/g, "");
  const nascimento = entrada.data.birth_date
    ? dataISO(entrada.data.birth_date)
    : null;

  if (!telefone) return NextResponse.json(VAZIO);

  const confere = doMesmoNumero(telefone);

  if (cpf.length === 11) {
    const porCpf = await db
      .select(CAMPOS)
      .from(patientsTable)
      .where(eq(patientsTable.cpfNumber, cpf))
      .limit(5);

    if (porCpf.length > 0) {
      // Titular falando do próprio número: o telefone já provou quem é.
      const doTitular = porCpf.filter(confere).sort(maisRecente)[0];
      if (doTitular) return NextResponse.json(resposta(doTitular));

      // Outro número — dependente, ou alguém com um CPF que não é dele. A data
      // de nascimento decide, e cadastro sem data não passa: "não tenho como
      // conferir" precisa responder como "não confere", senão a linha
      // incompleta vira a porta de entrada.
      const comData = porCpf
        .filter((c) => nascimento !== null && c.birthDate === nascimento)
        .sort(maisRecente)[0];

      return NextResponse.json(comData ? resposta(comData) : VAZIO);
    }
  }

  // Sem CPF, ou com um CPF que não está cadastrado: o identificador é o número
  // que está falando.
  const porTelefone = await db
    .select(CAMPOS)
    .from(patientsTable)
    .where(
      sql`right(regexp_replace(${patientsTable.phoneNumber}, '[^0-9]', '', 'g'), 8) = ${telefone.final}`,
    )
    .limit(10);

  const daPessoa = porTelefone.filter(confere);
  const titulares = new Set(daPessoa.map((c) => c.name.trim().toLowerCase()));

  // Telefone de família, com titulares diferentes no mesmo número, não tem
  // resposta certa — e resposta plausível e errada é pior que nenhuma, porque o
  // paciente age sobre ela. Vazio aqui vira o texto de não encontrado, que manda
  // falar com uma pessoa.
  if (titulares.size !== 1) return NextResponse.json(VAZIO);

  return NextResponse.json(resposta(daPessoa.sort(maisRecente)[0]));
}
