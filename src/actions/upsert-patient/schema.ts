import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";

// Configurar plugins do dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Função para validar CPF
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleanCPF.charAt(10));
};

export const upsertPatientSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, { message: "Nome titular é obrigatório" }),
    birthDate: z.string().optional(),
    phoneNumber: z
      .string()
      .trim()
      .min(10, { message: "Telefone é obrigatório" }),
    rgNumber: z.string().optional(),
    cpfNumber: z
      .string()
      .optional()
      .refine((cpf) => !cpf || isValidCPF(cpf), {
        message: "CPF inválido",
      }),
    address: z.string().optional(),
    homeNumber: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),

    cardType: z.enum(["enterprise", "personal"], {
      message: "Tipo de cartão é obrigatório",
    }),
    Enterprise: z.string().optional(),
    numberCards: z.number().optional(),
    sellerId: z.string().uuid({ message: "Vendedor é obrigatório" }),
    clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
    observation: z.string().optional(),
    expirationDate: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          if (!dayjs(value).isValid()) return false;

          // Converter ambas as datas para UTC para comparação correta
          const inputDate = dayjs(value).utc().startOf("day");
          const today = dayjs().utc().startOf("day");

          return inputDate.isAfter(today) || inputDate.isSame(today);
        },
        {
          message: "Data de vencimento não pode ser uma data passada",
        },
      ),
    dependents1: z.string().optional(),
    dependents2: z.string().optional(),
    dependents3: z.string().optional(),
    dependents4: z.string().optional(),
    dependents5: z.string().optional(),
    dependents6: z.string().optional(),
  })
  .superRefine(async (data, ctx) => {
    // Verificar se CPF já existe no banco (somente se CPF foi fornecido)
    if (data.cpfNumber && data.cpfNumber.trim() !== "") {
      const cleanCPF = data.cpfNumber.replace(/\D/g, "");

      let whereCondition = eq(patientsTable.cpfNumber, cleanCPF);

      // Se é uma edição, excluir o próprio registro da busca
      if (data.id) {
        whereCondition = and(
          eq(patientsTable.cpfNumber, cleanCPF),
          ne(patientsTable.id, data.id),
        ) as typeof whereCondition;
      }

      const existingPatient = await db
        .select()
        .from(patientsTable)
        .where(whereCondition)
        .limit(1);

      if (existingPatient.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este CPF já está cadastrado no sistema",
          path: ["cpfNumber"],
        });
      }
    }
  });

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
