import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/whatsapp/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface ContactRow {
  name: string;
  phoneNumber: string;
}

/**
 * Telefone como o Excel não estraga: "(87) 99137-2728".
 *
 * Só dígitos ("87991372728") o Excel lê como número — vira 8,8E+10 e perde
 * zero à esquerda. Com a máscara fica texto. O cadastro tem o número com ou
 * sem máscara, com ou sem 55; a regra de validade é a mesma do envio por
 * WhatsApp. Número inválido ou o placeholder de quem não tem telefone sai em
 * branco: não serve para contato e, só de dígitos, o Excel o corromperia.
 */
export function formatPhoneForSpreadsheet(phoneNumber: string): string {
  if (!isValidPhoneNumber(phoneNumber)) return "";

  // Sem o 55: DDD + 8 ou 9 dígitos
  const national = formatPhoneNumber(phoneNumber).slice(2);
  const ddd = national.slice(0, 2);
  const number = national.slice(2);
  const splitAt = number.length - 4;

  return `(${ddd}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`;
}

/**
 * Um campo do CSV. Aspas quando tem separador, aspas ou quebra de linha; e um
 * apóstrofo antes de "=", "+", "-" ou "@" no começo, para o Excel não
 * executar o texto como fórmula.
 */
function csvField(value: string): string {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safeValue)
    ? `"${safeValue.replace(/"/g, '""')}"`
    : safeValue;
}

/**
 * CSV de contatos (telefone; nome) que abre direto no Excel em pt-BR:
 * UTF-8 com BOM (acentos certos), ";" como separador e quebra de linha CRLF.
 */
export function buildContactsCsv(rows: ContactRow[]): string {
  const lines = [
    ["telefone", "nome"],
    ...rows.map((row) => [
      formatPhoneForSpreadsheet(row.phoneNumber),
      row.name.trim(),
    ]),
  ].map((fields) => fields.map(csvField).join(";"));

  return `﻿${lines.join("\r\n")}\r\n`;
}

/** "todos_cartao_vencidos_17-11-2026.csv", com o dia de São Paulo. */
export function expiredContactsFileName(now: Date = new Date()): string {
  const day = dayjs(now).tz("America/Sao_Paulo").format("DD-MM-YYYY");
  return `todos_cartao_vencidos_${day}.csv`;
}
