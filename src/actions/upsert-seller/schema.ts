import { z } from "zod";

export const upsertSellerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  cpfNumber: z.string().trim().min(11, { message: "CPF inválido" }),
  phoneNumber: z.string().trim().min(11, { message: "Telefone é obrigatório" }),
  unity: z.string().trim().min(1, { message: "Unidade é obrigatória" }),
});
export type UpsertSellerSchema = z.infer<typeof upsertSellerSchema>;
