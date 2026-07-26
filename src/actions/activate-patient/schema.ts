import { z } from "zod";

export const activatePatientSchema = z.object({
  patientId: z.string().uuid({ message: "ID do paciente é obrigatório" }),
  paymentType: z.enum(["pix", "dinheiro", "cartao_credito", "cartao_debito"], {
    message: "Tipo de pagamento é obrigatório",
  }),
});

export type ActivatePatientSchema = z.infer<typeof activatePatientSchema>;
