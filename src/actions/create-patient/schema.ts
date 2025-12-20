import { z } from "zod";

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

export const createPatientSchema = z
  .object({
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
    numberCards: z
      .string()
      .optional()
      .refine((value) => !value || parseInt(value) > 0, {
        message: "A quantidade de cartões deve ser maior que 0",
      })
      .refine((value) => !value || parseInt(value) <= 6, {
        message: "A quantidade de cartões não pode ser maior que 6",
      }),

    clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
    sellerId: z.string().uuid({ message: "Vendedor é obrigatório" }),
    observation: z.string().optional(),
    dependents1: z.string().optional(),
    dependents2: z.string().optional(),
    dependents3: z.string().optional(),
    dependents4: z.string().optional(),
    dependents5: z.string().optional(),
    dependents6: z.string().optional(),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "Você deve aceitar os termos de uso e política de privacidade",
    }),
    whatsappConsent: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      data.cardType === "enterprise" &&
      (!data.Enterprise || data.Enterprise.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome da empresa é obrigatório para cartão empresarial",
        path: ["Enterprise"],
      });
    }
  });
