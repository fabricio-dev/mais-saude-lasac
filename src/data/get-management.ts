import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { and, count, eq, gte, inArray, lte, sql } from "drizzle-orm";

dayjs.locale("pt-br");

import { db } from "@/db";
import { patientsTable, usersToClinicsTable } from "@/db/schema";

interface Params {
  from: string;
  to: string;
  clinicId?: string; // "all" para todas as clínicas ou ID específico
  session: {
    user: {
      id: string;
      email: string;
    };
  };
}

interface ManagementData {
  faturamentoTotal: number;
  totalConvenios: number;
  conveniosVencidos: number;
  conveniosRenovados: number;
  novosConvenios: number;
  totalPatients: number;
  totalEnterprise: number;
  totalPatientsRenovated: number;
  totalEnterpriseRenovated: number;
  faturamentoMensal: {
    month: string;
    faturamento: number;
    isWithinPeriod?: boolean;
  }[];
}

// Função auxiliar para calcular faturamento mensal
const getFaturamentoMensal = async (
  clinicIds: string[],
  from: string,
  to: string,
): Promise<
  { month: string; faturamento: number; isWithinPeriod?: boolean }[]
> => {
  // console.log("getFaturamentoMensal - Parâmetros:", { clinicIds, from, to });

  const startDate = dayjs(from);
  const endDate = dayjs(to);

  // Calcular diferença em meses
  const monthsDiff = endDate.diff(startDate, "month") + 1;

  // Se o período for menor que 3 meses, expandir para incluir mês anterior e próximo
  let adjustedStartDate = startDate.startOf("month");
  let adjustedEndDate = endDate.startOf("month");

  if (monthsDiff < 3) {
    adjustedStartDate = startDate.subtract(1, "month").startOf("month");
    adjustedEndDate = endDate.add(1, "month").startOf("month");
  }

  const months: {
    month: string;
    faturamento: number;
    isWithinPeriod?: boolean;
  }[] = [];
  let currentDate = adjustedStartDate;

  while (
    currentDate.isBefore(adjustedEndDate) ||
    currentDate.isSame(adjustedEndDate, "month")
  ) {
    const monthStart = currentDate.startOf("month").toDate();
    const monthEnd = currentDate.endOf("month").toDate();

    // Verificar se o mês atual está dentro do período original selecionado
    const isWithinOriginalPeriod =
      (currentDate.isAfter(startDate.startOf("month")) ||
        currentDate.isSame(startDate.startOf("month"), "month")) &&
      (currentDate.isBefore(endDate.startOf("month")) ||
        currentDate.isSame(endDate.startOf("month"), "month"));

    let periodStart: Date;
    let periodEnd: Date;

    if (isWithinOriginalPeriod) {
      // Para meses dentro do período original, usar os limites do período selecionado
      periodStart = monthStart < new Date(from) ? new Date(from) : monthStart;
      periodEnd = monthEnd > new Date(to) ? new Date(to) : monthEnd;
    } else {
      // Para meses extras (anterior/próximo), usar o mês completo
      periodStart = monthStart;
      periodEnd = monthEnd;
    }

    // Buscar pacientes novos no mês
    const [totalPatientsMonth] = await db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(patientsTable.clinicId, clinicIds),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, periodStart),
          lte(patientsTable.activeAt, periodEnd),
        ),
      );

    // Buscar pacientes renovados no mês
    const [totalPatientsRenovatedMonth] = await db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(patientsTable.clinicId, clinicIds),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, periodStart),
          lte(patientsTable.reactivatedAt, periodEnd),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      );

    // Buscar pacientes de empresas novos no mês
    const [totalEnterpriseMonth] = await db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(patientsTable.clinicId, clinicIds),
          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, periodStart),
          lte(patientsTable.activeAt, periodEnd),
        ),
      );

    // Buscar pacientes de empresas renovados no mês
    const [totalEnterpriseRenovatedMonth] = await db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(patientsTable.clinicId, clinicIds),
          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, periodStart),
          lte(patientsTable.reactivatedAt, periodEnd),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      );

    // Calcular faturamento do mês usando a mesma lógica
    const totalPatientsMonth_total =
      (totalPatientsMonth?.total || 0) +
      (totalPatientsRenovatedMonth?.total || 0);
    const totalEnterpriseMonth_total =
      (totalEnterpriseMonth?.total || 0) +
      (totalEnterpriseRenovatedMonth?.total || 0);
    const faturamentoMes =
      (totalPatientsMonth_total - totalEnterpriseMonth_total) * 100 +
      totalEnterpriseMonth_total * 90;

    // Mapeamento de meses para português
    const monthNames = {
      Jan: "Jan",
      Feb: "Fev",
      Mar: "Mar",
      Apr: "Abr",
      May: "Mai",
      Jun: "Jun",
      Jul: "Jul",
      Aug: "Ago",
      Sep: "Set",
      Oct: "Out",
      Nov: "Nov",
      Dec: "Dez",
    };

    const monthKey = currentDate.format("MMM") as keyof typeof monthNames;

    months.push({
      month: monthNames[monthKey] || currentDate.format("MMM"),
      faturamento: faturamentoMes,
      isWithinPeriod: isWithinOriginalPeriod,
    });

    // console.log(`Mês ${currentDate.format("MMM")}: faturamento = ${faturamentoMes}`);

    currentDate = currentDate.add(1, "month");
  }

  // console.log("getFaturamentoMensal - Resultado final:", months);
  return months;
};

export const getManagement = async ({
  from,
  to,
  clinicId = "all",
  session,
}: Params): Promise<ManagementData> => {
  try {
    // Buscar clínicas do usuário
    const userClinics = await db
      .select({ clinicId: usersToClinicsTable.clinicId })
      .from(usersToClinicsTable)
      .where(eq(usersToClinicsTable.userId, session.user.id));

    const clinicIds = userClinics.map((uc) => uc.clinicId);

    // Se não tem acesso a nenhuma clínica, retornar dados vazios
    if (clinicIds.length === 0) {
      return {
        faturamentoTotal: 0,
        totalConvenios: 0,
        conveniosVencidos: 0,
        conveniosRenovados: 0,
        novosConvenios: 0,
        totalPatients: 0,
        totalEnterprise: 0,
        totalPatientsRenovated: 0,
        totalEnterpriseRenovated: 0,
        faturamentoMensal: [],
      };
    }

    // Definir quais clínicas incluir na consulta
    let targetClinicIds = clinicIds;
    if (clinicId !== "all") {
      // Verificar se o usuário tem acesso à clínica específica
      if (clinicIds.includes(clinicId)) {
        targetClinicIds = [clinicId];
      } else {
        // Se não tem acesso, retornar dados vazios
        return {
          faturamentoTotal: 0,
          totalConvenios: 0,
          conveniosVencidos: 0,
          conveniosRenovados: 0,
          novosConvenios: 0,
          totalPatients: 0,
          totalEnterprise: 0,
          totalPatientsRenovated: 0,
          totalEnterpriseRenovated: 0,
          faturamentoMensal: [],
        };
      }
    }

    // Usar a mesma lógica do dashboard: filtrar diretamente por clinicId em vez de sellerId

    const [
      [totalPatients = { total: 0 }],
      [totalPatientsRenovated = { total: 0 }],
      [totalEnterprise = { total: 0 }],
      [totalEnterpriseRenovated = { total: 0 }],
      [novosConvenios = { total: 0 }],
      [conveniosRenovados = { total: 0 }],
      [conveniosVencidos = { total: 0 }],
      [totalAtivos = { total: 0 }],
    ] = await Promise.all([
      // Pacientes ativados pela primeira vez no período - EXATA igual ao dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.activeAt, new Date(from)),
            lte(patientsTable.activeAt, new Date(to)),
          ),
        ),

      // Pacientes renovados no período - EXATA igual ao dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.reactivatedAt, new Date(from)),
            lte(patientsTable.reactivatedAt, new Date(to)),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
          ),
        ),

      // Total de pacientes de empresas NOVOS - EXATA igual ao dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.cardType, "enterprise"),
            eq(patientsTable.isActive, true),
            gte(patientsTable.activeAt, new Date(from)),
            lte(patientsTable.activeAt, new Date(to)),
          ),
        ),

      // Total de pacientes de empresas RENOVADOS - EXATA igual ao dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.cardType, "enterprise"),
            eq(patientsTable.isActive, true),
            gte(patientsTable.reactivatedAt, new Date(from)),
            lte(patientsTable.reactivatedAt, new Date(to)),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
          ),
        ),

      // Novos convênios no período (baseado em activeAt)
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.activeAt, new Date(from)),
            lte(patientsTable.activeAt, new Date(to)),
          ),
        ),

      // Convênios renovados no período (baseado em reactivatedAt)
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, true),
            gte(patientsTable.reactivatedAt, new Date(from)),
            lte(patientsTable.reactivatedAt, new Date(to)),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
          ),
        ),

      // Convênios vencidos no período (pacientes que expiraram) - mesma lógica do dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, false),
            gte(patientsTable.expirationDate, new Date(from)),
            lte(patientsTable.expirationDate, new Date(to)),
          ),
        ),

      // Total de convênios ativos no período - mesma lógica do dashboard
      db
        .select({
          total: count(),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(patientsTable.clinicId, targetClinicIds),
            eq(patientsTable.isActive, true),
            sql`(
              (${patientsTable.activeAt} >= ${new Date(from)} AND ${patientsTable.activeAt} <= ${new Date(to)}) OR 
              (${patientsTable.reactivatedAt} >= ${new Date(from)} AND ${patientsTable.reactivatedAt} <= ${new Date(to)} AND ${patientsTable.reactivatedAt} IS NOT NULL)
            )`,
          ),
        ),
    ]);

    // Calcular faturamento exatamente igual ao dashboard
    // totalPatients = todos os pacientes novos
    // totalEnterprise = apenas os pacientes enterprises novos
    // totalPatientsRenovated = todos os pacientes renovados
    // totalEnterpriseRenovated = apenas os pacientes enterprises renovados

    // Cálculo igual ao dashboard:
    // formatCurrencyInCents(totalPatients.total + totalPatientsRenovated.total, totalEnterprise.total + totalEnterpriseRenovated.total)
    const totalPatientsTotal =
      totalPatients.total + totalPatientsRenovated.total;
    const totalEnterpriseTotal =
      totalEnterprise.total + totalEnterpriseRenovated.total;

    // Calcular faturamento total usando a mesma lógica do dashboard
    const faturamentoTotal =
      (totalPatientsTotal - totalEnterpriseTotal) * 100 +
      totalEnterpriseTotal * 90;

    // Calcular faturamento mensal
    const faturamentoMensal = await getFaturamentoMensal(
      targetClinicIds,
      from,
      to,
    );

    return {
      faturamentoTotal,
      totalConvenios: totalAtivos.total,
      conveniosVencidos: conveniosVencidos.total,
      conveniosRenovados: conveniosRenovados.total,
      novosConvenios: novosConvenios.total,
      totalPatients: totalPatientsTotal,
      totalEnterprise: totalEnterpriseTotal,
      totalPatientsRenovated: totalPatientsRenovated.total,
      totalEnterpriseRenovated: totalEnterpriseRenovated.total,
      faturamentoMensal,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de management:", error);
    return {
      faturamentoTotal: 0,
      totalConvenios: 0,
      conveniosVencidos: 0,
      conveniosRenovados: 0,
      novosConvenios: 0,
      totalPatients: 0,
      totalEnterprise: 0,
      totalPatientsRenovated: 0,
      totalEnterpriseRenovated: 0,
      faturamentoMensal: [],
    };
  }
};
