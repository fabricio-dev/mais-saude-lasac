import dayjs from "dayjs";
import { and, count, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable, sellersTable, usersToClinicsTable } from "@/db/schema";

interface GetVendedoresParams {
  from: string;
  to: string;
  clinicId: string;
  vendedorId?: string;
  session: {
    user: {
      id: string;
    };
  };
}

export async function getVendedores({
  from,
  to,
  clinicId,
  vendedorId,
  session,
}: GetVendedoresParams) {
  try {
    // Validar se clinicId não é "all" - essa função requer uma clínica específica
    if (clinicId === "all") {
      throw new Error("Esta função requer uma clínica específica");
    }

    // Verificar se o usuário tem acesso à clínica especificada
    const userClinicAccess = await db
      .select()
      .from(usersToClinicsTable)
      .where(
        and(
          eq(usersToClinicsTable.userId, session.user.id),
          eq(usersToClinicsTable.clinicId, clinicId),
        ),
      );

    if (userClinicAccess.length === 0) {
      throw new Error("Acesso negado à clínica");
    }

    // Buscar vendedores da clínica
    let vendedorIds: string[] = [];
    const vendedores = await db.query.sellersTable.findMany({
      where: eq(sellersTable.clinicId, clinicId),
      columns: {
        id: true,
        name: true,
        clinicId: true,
      },
    });

    if (vendedorId && vendedorId !== "all") {
      const vendedorExists = vendedores.find((v) => v.id === vendedorId);
      if (!vendedorExists) {
        throw new Error("Vendedor não encontrado");
      }
      vendedorIds = [vendedorId];
    } else {
      vendedorIds = vendedores.map((v) => v.id);
    }

    // Definir datas com horário completo
    const fromDate = dayjs(from).startOf("day").toDate();
    const toDate = dayjs(to).endOf("day").toDate();

    // Buscar estatísticas gerais usando a mesma lógica do get-management e get-dashboard
    const [
      [totalPatientsNovos = { total: 0 }],
      [totalPatientsRenovados = { total: 0 }],
      [totalEnterprise = { total: 0 }],
      [totalEnterpriseRenovados = { total: 0 }],
      patientsNovos,
      patientsRenovados,
    ] = await Promise.all([
      // Pacientes novos ativados no período
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.sellerId, vendedorIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.activeAt, fromDate),
            lte(patientsTable.activeAt, toDate),
          ),
        ),

      // Pacientes renovados no período
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.sellerId, vendedorIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.reactivatedAt, fromDate),
            lte(patientsTable.reactivatedAt, toDate),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
          ),
        ),

      // Pacientes enterprise novos
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.sellerId, vendedorIds),
            eq(patientsTable.cardType, "enterprise"),
            eq(patientsTable.isActive, true),
            gte(patientsTable.activeAt, fromDate),
            lte(patientsTable.activeAt, toDate),
          ),
        ),

      // Pacientes enterprise renovados
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.sellerId, vendedorIds),
            eq(patientsTable.cardType, "enterprise"),
            eq(patientsTable.isActive, true),
            gte(patientsTable.reactivatedAt, fromDate),
            lte(patientsTable.reactivatedAt, toDate),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
          ),
        ),

      // Buscar pacientes novos ativados no período (detalhes)
      db.query.patientsTable.findMany({
        where: and(
          inArray(patientsTable.sellerId, vendedorIds),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, fromDate),
          lte(patientsTable.activeAt, toDate),
        ),
        with: {
          seller: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Buscar pacientes renovados no período (detalhes)
      db.query.patientsTable.findMany({
        where: and(
          inArray(patientsTable.sellerId, vendedorIds),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, fromDate),
          lte(patientsTable.reactivatedAt, toDate),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
        with: {
          seller: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Combinar os dois arrays de pacientes
    const patients = [...patientsNovos, ...patientsRenovados];

    // Calcular totais usando a mesma lógica do get-management
    const totalVendas = totalPatientsNovos.total + totalPatientsRenovados.total;
    const totalEnterpriseTotal =
      totalEnterprise.total + totalEnterpriseRenovados.total;

    // Calcular faturamento usando a mesma lógica do get-management
    const faturamentoTotal =
      (totalVendas - totalEnterpriseTotal) * 100 + totalEnterpriseTotal * 90;

    const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

    // Usar os totais das consultas em vez de filtrar o array
    const empresariais = totalEnterpriseTotal;
    const individuais = totalVendas - totalEnterpriseTotal;

    // Usar os totais das consultas para novos vs renovações
    const renovacoes = totalPatientsRenovados.total;
    const novos = totalPatientsNovos.total;

    // Calcular ranking de vendedores
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const vendedorStats = vendedores.map((vendedor) => {
      const vendedorPatients = patients.filter(
        (p) => p.sellerId === vendedor.id,
      );

      // Usar a mesma lógica do faturamento total (contadores)
      const totalConvenios = vendedorPatients.length;
      const conveniosEmpresariais = vendedorPatients.filter(
        (p) => p.cardType === "enterprise",
      ).length;
      const conveniosIndividuais = totalConvenios - conveniosEmpresariais;

      // Calcular faturamento igual ao faturamento total
      const faturamento =
        conveniosIndividuais * 100 + conveniosEmpresariais * 90;
      const renovacoesVendedor = vendedorPatients.filter(
        (p) => p.reactivatedAt && new Date(p.reactivatedAt) > sixMonthsAgo,
      ).length;
      const novosConvenios = vendedorPatients.filter(
        (p) => !p.reactivatedAt || new Date(p.reactivatedAt) <= sixMonthsAgo,
      ).length;

      // Meta mockada (pode ser implementada no banco depois)
      const meta = 100000; // Meta padrão
      const percentualMeta = meta > 0 ? (faturamento / meta) * 100 : 0;

      return {
        nome: vendedor.name,
        vendas: totalConvenios,
        faturamento,
        meta,
        percentualMeta,
        totalConvenios,
        conveniosEmpresariais,
        renovacoes: renovacoesVendedor,
        novosConvenios,
      };
    });

    // Ordenar ranking por faturamento
    const rankingVendedores = vendedorStats.sort(
      (a, b) => b.faturamento - a.faturamento,
    );

    const vendedorTop = rankingVendedores[0]?.nome || "";
    const metaAtingida =
      rankingVendedores.length > 0
        ? rankingVendedores.reduce((sum, v) => sum + v.percentualMeta, 0) /
          rankingVendedores.length
        : 0;

    // Comissões mockadas (5% do faturamento)
    const comissoesTotais = faturamentoTotal * 0.05;

    // Gerar faturamento mensal
    const faturamentoMensal = generateMonthlyRevenue(patients, vendedorId);

    return {
      totalVendas,
      faturamentoTotal,
      ticketMedio,
      metaAtingida,
      comissoesTotais,
      vendedorTop,
      rankingVendedores,
      distribuicaoVendas: {
        renovacao: renovacoes,
        novo: novos,
      },
      tiposConvenio: {
        empresarial: empresariais,
        individual: individuais,
      },
      faturamentoMensal,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de vendedores:", error);
    throw error;
  }
}

// Função para gerar faturamento mensal
function generateMonthlyRevenue(
  patients: Array<{
    activeAt: Date | null;
    reactivatedAt: Date | null;
    cardType: string;
    numberCards?: number | null;
    sellerId: string | null;
    [key: string]: unknown;
  }>,
  vendedorId?: string,
) {
  const monthlyData: { [key: string]: number } = {};

  // Filtrar pacientes pelo vendedor se especificado
  const filteredPatients =
    vendedorId && vendedorId !== "all"
      ? patients.filter((p) => p.sellerId === vendedorId)
      : patients;

  filteredPatients.forEach((patient) => {
    // Usar activeAt ou reactivatedAt para determinar quando o paciente gerou faturamento
    const relevantDate = patient.reactivatedAt || patient.activeAt;

    if (!relevantDate || !patient.sellerId) return;

    const date = new Date(relevantDate);
    const monthKey = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }

    // Usar a mesma lógica de faturamento dos outros cálculos (sem multiplicar por numberCards)
    const valorBase = patient.cardType === "enterprise" ? 90 : 100;
    monthlyData[monthKey] += valorBase;
  });

  // Se não há dados mensais, retornar array vazio
  if (Object.keys(monthlyData).length === 0) {
    return [];
  }

  // Converter para array e ordenar por data
  const monthlyArray = Object.entries(monthlyData)
    .map(([mes, faturamento]) => ({
      mes,
      faturamento,
    }))
    .sort((a, b) => {
      const [monthA, yearA] = a.mes.split("/");
      const [monthB, yearB] = b.mes.split("/");
      const dateA = new Date(2000 + parseInt(yearA), parseInt(monthA) - 1);
      const dateB = new Date(2000 + parseInt(yearB), parseInt(monthB) - 1);
      return dateA.getTime() - dateB.getTime();
    });

  return monthlyArray;
}
