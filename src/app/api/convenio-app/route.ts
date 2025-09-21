import { NextRequest, NextResponse } from "next/server";

import { createPatient } from "@/actions/create-patient";
import { createPatientSchema } from "@/actions/create-patient/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Buscar um vendedor "cadastro-externo" para a clínica selecionada
    let sellerId = body.sellerId;

    if (!sellerId && body.clinicId) {
      try {
        const sellersResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/public/sellers?clinicId=${body.clinicId}`,
          { method: "GET" },
        );

        if (sellersResponse.ok) {
          const sellers = await sellersResponse.json();
          if (sellers.length > 0) {
            sellerId = sellers[0].id;
          }
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
