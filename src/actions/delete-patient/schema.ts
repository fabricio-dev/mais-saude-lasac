import { z } from "zod";

export const deletePatientSchema = z.object({
  id: z.string().uuid("ID do paciente deve ser um UUID válido"),
});
