import { NextResponse } from "next/server";

import { getExternalSellers } from "@/data/get-external-sellers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId é obrigatório" },
        { status: 400 },
      );
    }

    const sellers = await getExternalSellers(clinicId);

    return NextResponse.json(sellers);
  } catch (error) {
    console.error("Erro ao buscar vendedores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
