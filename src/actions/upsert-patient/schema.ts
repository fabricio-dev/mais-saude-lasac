import { z } from "zod";

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome titular é obrigatório" }),
  birthDate: z.string().min(1, { message: "Data de nascimento é obrigatória" }),
  phoneNumber: z.string().trim().min(10, { message: "Telefone é obrigatório" }),
  rgNumber: z.string().trim().min(1, { message: "RG é obrigatório" }),
  cpfNumber: z.string().trim().min(11, { message: "CPF é obrigatório" }),
  address: z.string().trim().min(1, { message: "Endereço é obrigatório" }),
  homeNumber: z.string().trim().min(1, { message: "Bairro é obrigatório" }),
  city: z.string().trim().min(1, { message: "Cidade é obrigatória" }),
  state: z.string().trim().min(2, { message: "UF é obrigatória" }),

  cardType: z.enum(["enterprise", "personal"], {
    message: "Tipo de cartão é obrigatório",
  }),
  Enterprise: z.string().optional(),
  numberCards: z
    .number()
    .min(1, { message: "Quantidade de cartões é obrigatória" }),
  sellerId: z.string().uuid({ message: "Vendedor é obrigatório" }),
  clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
  observation: z.string().optional(),
  dependents1: z.string().optional(),
  dependents2: z.string().optional(),
  dependents3: z.string().optional(),
  dependents4: z.string().optional(),
  dependents5: z.string().optional(),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
