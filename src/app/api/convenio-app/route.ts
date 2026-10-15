import { NextRequest, NextResponse } from "next/server";

import { createPatient } from "@/actions/create-patient";
import { createPatientSchema } from "@/actions/create-patient/schema";
import { getExternalSellers } from "@/data/get-external-sellers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Buscar um vendedor "cadastro-externo" para a clínica selecionada
    let sellerId = body.sellerId;

    // Direto no banco, e não por HTTP para /api/public/sellers: a chamada ao
    // próprio servidor dependia de NEXTAUTH_URL, que não existe neste projeto,
    // e caía em localhost:3000.
    if (!sellerId && body.clinicId) {
      try {
        const sellers = await getExternalSellers(String(body.clinicId));
        if (sellers.length > 0) {
          sellerId = sellers[0].id;
        }
      } catch (error) {
        console.error("Erro ao buscar vendedor:", error);
      }
    }

    // Adicionar sellerId aos dados se encontrado
    const dataWithSeller = {
      ...body,
      sellerId: sellerId || "default-external-seller",
    };

    // Validar dados com o schema
    const validation = createPatientSchema.safeParse(dataWithSeller);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    // Executar a ação de criar paciente
    const result = await createPatient(validation.data);

    if (result?.serverError) {
      return NextResponse.json({ error: result.serverError }, { status: 500 });
    }

    if (result?.validationErrors) {
      return NextResponse.json(
        { error: "Erro de validação", details: result.validationErrors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solicitação de convênio enviada com sucesso!",
    });
  } catch (error) {
    console.error("Erro na API convenio-app:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
