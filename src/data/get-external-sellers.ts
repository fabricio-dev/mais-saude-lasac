import { db } from "@/db";

/**
 * Vendedores "Cadastro-externo" da clínica — a quem fica atribuído o paciente
 * que se cadastra sozinho, pelo formulário público.
 */
export const getExternalSellers = (clinicId: string) =>
  db.query.sellersTable.findMany({
    where: (seller, { eq, and, ilike }) =>
      and(
        eq(seller.clinicId, clinicId),
        ilike(seller.name, "%cadastro-externo%"),
      ),
    columns: {
      id: true,
      name: true,
      clinicId: true,
    },
    orderBy: (seller, { asc }) => asc(seller.name),
  });
