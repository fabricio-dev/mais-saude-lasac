import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { consultarPacientes } from "@/actions/consultar-convenios";

// Schema para validação da requisição
const consultaSchema = z.object({
  termo: z.string().min(1, "Termo de busca é obrigatório"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação dos dados recebidos
    const validation = consultaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    // Consultar pacientes no banco
    const resultado = await consultarPacientes(validation.data.termo);

    if (!resultado.success) {
      return NextResponse.json(
        {
          success: false,
          error: resultado.error,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.data,
    });
  } catch (error) {
    console.error("Erro na API de consulta:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
