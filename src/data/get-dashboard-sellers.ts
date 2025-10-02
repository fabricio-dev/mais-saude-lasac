import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  clinicsTable,
  patientsTable,
  sellersTable,
  usersToClinicsTable,
} from "@/db/schema";

// Configurar plugins do dayjs para lidar corretamente com fusos horários
dayjs.extend(utc);
dayjs.extend(timezone);

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      id: string;
      email: string;
    };
  };
}

export const getDashboardSellers = async ({ from, to, session }: Params) => {
  // Verificar se o vendedor existe na tabela sellers
  const seller = await db.query.sellersTable.findFirst({
    where: eq(sellersTable.email, session.user.email),
  });

  // Se não encontrar vendedor, retornar dados vazios
  if (!seller) {
    return {
      totalPatients: { total: 0 },
      totalRenovados: { total: 0 },
      totalEnterprise: { total: 0 },
      totalEnterpriseRenovated: { total: 0 },
      topSellers: [],
      patientsToExpire: [],
      dailyConveniosData: [],
      deactivatePatients: null,
      sellerClinic: null,
    };
  }

  // Todas as datas agora em UTC para compatibilidade com o banco
  const chartSatartDate = dayjs()
    .utc()
    .subtract(14, "days")
    .startOf("day")
    .toDate();
  const chartEndDate = dayjs().utc().add(10, "days").endOf("day").toDate();
  const regeExpiratedDate = dayjs()
    .utc()
    .subtract(90, "days")
    .startOf("day")
    .toDate();
  const regeExpiratedEndDate = dayjs()
    .utc()
    .add(14, "days")
    .endOf("day")
    .toDate();

  // Definindo datas com horário completo - Considerando fuso horário brasileiro
  // Interpreta a data como horário local de São Paulo e converte para UTC
  const fromDate = dayjs
    .tz(`${from} 00:00:00`, "America/Sao_Paulo")
    .utc()
    .toDate();
  const toDate = dayjs.tz(`${to} 23:59:59`, "America/Sao_Paulo").utc().toDate();

  const conveniosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.activeAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`;
  const conveniosRenovadosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' >= ${fromDate} AND ${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`;
  const totalCondition = sql<number>`${conveniosCondition} + ${conveniosRenovadosCondition}`;

  const [
    [totalPatients = { total: 0 }],
    [totalRenovados = { total: 0 }],
    [totalEnterprise = { total: 0 }],
    [totalEnterpriseRenovated = { total: 0 }],
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
    deactivateNullExpirationPatients,
    reactivatePatients,
    [sellerClinic = { clinicName: null }],
  ] = await Promise.all([
    // TODO: Implementa a query para o total de pacientes
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, fromDate),
          lte(patientsTable.activeAt, toDate),
        ),
      ),
    // Query para total de pacientes renovados (reativados) do vendedor logado
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, fromDate),
          lte(patientsTable.reactivatedAt, toDate),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      ),
    // TODO: Implementa a query para o total de pacientes de empresas
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, fromDate),
          lte(patientsTable.activeAt, toDate),
        ),
      ),
    // TODO: Implementa a query para o total de pacientes de empresas renovados
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),

          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, fromDate),
          lte(patientsTable.reactivatedAt, toDate),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      ),
    // Top vendedores - usando condições SQL globais (sem duplicidade)
    db
      .select({
        id: sellersTable.id,
        name: sellersTable.name,
        email: sellersTable.email,
        avatarImageUrl: sellersTable.avatarImageUrl,
        clinic: clinicsTable.name,
        convenios: conveniosCondition.mapWith(Number),
        conveniosRenovados: conveniosRenovadosCondition.mapWith(Number),
      })
      .from(sellersTable)
      .innerJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
      .leftJoin(
        patientsTable,
        and(
          eq(sellersTable.id, patientsTable.sellerId),
          eq(patientsTable.isActive, true),
        ),
      )
      .where(
        inArray(
          sellersTable.clinicId,
          db
            .select({ clinicId: usersToClinicsTable.clinicId })
            .from(usersToClinicsTable)
            .where(
              inArray(
                usersToClinicsTable.userId,
                db
                  .select({ userId: usersToClinicsTable.userId })
                  .from(usersToClinicsTable)
                  .innerJoin(
                    sellersTable,
                    eq(usersToClinicsTable.clinicId, sellersTable.clinicId),
                  )
                  .where(eq(sellersTable.email, session.user.email)),
              ),
            ),
        ),
      )
      .groupBy(sellersTable.id, clinicsTable.name)
      .orderBy(desc(totalCondition))
      .limit(5),

    // Pacientes do vendedor logado que estão para expirar
    db.query.patientsTable.findMany({
      where: and(
        inArray(
          patientsTable.sellerId,
          db
            .select({ sellerId: sellersTable.id })
            .from(sellersTable)
            .where(eq(sellersTable.email, session.user.email)),
        ),
        gte(patientsTable.expirationDate, regeExpiratedDate),
        lte(patientsTable.expirationDate, regeExpiratedEndDate),
      ),
      with: {
        seller: true,
        clinic: true,
      },
      orderBy: asc(patientsTable.expirationDate),
      limit: 15,
    }),
    // TODO: Implementa a query para os convenios diários dentre um intervalo de 21 dias
    Promise.all([
      // Consulta para pacientes novos do vendedor logado (baseado na data de ativacao)
      // Convertendo de UTC para fuso horário local (UTC-3) antes de extrair a data
      db
        .select({
          date: sql<string>`DATE(${patientsTable.activeAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`.as(
            "date",
          ),
          count: count(patientsTable.id),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(
              patientsTable.sellerId,
              db
                .select({ sellerId: sellersTable.id })
                .from(sellersTable)
                .where(eq(sellersTable.email, session.user.email)),
            ),
            gte(patientsTable.activeAt, chartSatartDate),
            lte(patientsTable.activeAt, chartEndDate),
            eq(patientsTable.isActive, true),
          ),
        )
        .groupBy(
          sql<string>`DATE(${patientsTable.activeAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        )
        .orderBy(
          sql<string>`DATE(${patientsTable.activeAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        ),

      // Consulta para pacientes reativados do vendedor logado (baseado na data de reativação)
      // Convertendo de UTC para fuso horário local (UTC-3) antes de extrair a data
      db
        .select({
          date: sql<string>`DATE(${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`.as(
            "date",
          ),
          count: count(patientsTable.id),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(
              patientsTable.sellerId,
              db
                .select({ sellerId: sellersTable.id })
                .from(sellersTable)
                .where(eq(sellersTable.email, session.user.email)),
            ),
            gte(patientsTable.reactivatedAt, chartSatartDate),
            lte(patientsTable.reactivatedAt, chartEndDate),
            sql`${patientsTable.reactivatedAt} IS NOT NULL`,
            sql`${patientsTable.isActive} IS TRUE`,
          ),
        )
        .groupBy(
          sql<string>`DATE(${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        )
        .orderBy(
          sql<string>`DATE(${patientsTable.reactivatedAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        ),
    ]).then(([novosData, renovadosData]) => {
      // Criar mapa de todas as datas no período (convertendo para fuso horário local)
      const currentDate = dayjs(chartSatartDate)
        .utc()
        .utcOffset(-3 * 60); // UTC-3 (São Paulo)
      const endDate = dayjs(chartEndDate)
        .utc()
        .utcOffset(-3 * 60); // UTC-3 (São Paulo)
      const allDates: { date: string; novos: number; renovados: number }[] = [];

      // Gerar todas as datas do período
      let date = currentDate;
      while (date.isBefore(endDate) || date.isSame(endDate, "day")) {
        allDates.push({
          date: date.format("YYYY-MM-DD"),
          novos: 0,
          renovados: 0,
        });
        date = date.add(1, "day");
      }

      // Mapear dados de novos pacientes
      novosData.forEach((item) => {
        const foundDate = allDates.find((d) => d.date === item.date);
        if (foundDate) {
          foundDate.novos = item.count;
        }
      });

      // Mapear dados de pacientes renovados
      renovadosData.forEach((item) => {
        const foundDate = allDates.find((d) => d.date === item.date);
        if (foundDate) {
          foundDate.renovados = item.count;
        }
      });

      return allDates;
    }),
    // Desativar pacientes expirados do vendedor logado (usando UTC)
    db
      .update(patientsTable)
      .set({
        isActive: false,
        updatedAt: dayjs().utc().toDate(),
      })
      .where(
        and(
          lte(
            patientsTable.expirationDate,
            dayjs().utc().endOf("day").toDate(),
          ),
          eq(patientsTable.isActive, true),
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
        ),
      ),

    // Desativar pacientes com data de expiração nula ou vazia do vendedor logado
    db
      .update(patientsTable)
      .set({
        isActive: false,
      })
      .where(
        and(
          isNull(patientsTable.expirationDate),
          eq(patientsTable.isActive, true),
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
        ),
      ),

    // Reativar pacientes inativos com data de expiração válida do vendedor logado (usando UTC)
    db
      .update(patientsTable)
      .set({
        isActive: true,
      })
      .where(
        and(
          gte(
            patientsTable.expirationDate,
            dayjs().utc().startOf("day").toDate(),
          ),
          eq(patientsTable.isActive, false),
          // Apenas pacientes que já foram ativados pelo menos uma vez
          or(
            isNotNull(patientsTable.activeAt),
            isNotNull(patientsTable.reactivatedAt),
          ),
          inArray(
            patientsTable.sellerId,
            db
              .select({ sellerId: sellersTable.id })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
        ),
      ),
    // Buscar nome da clínica do vendedor
    db
      .select({
        clinicName: clinicsTable.name,
      })
      .from(sellersTable)
      .innerJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
      .where(eq(sellersTable.email, session.user.email))
      .limit(1),
  ]);

  return {
    totalPatients,
    totalRenovados,
    totalEnterprise,
    totalEnterpriseRenovated,
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
    deactivateNullExpirationPatients,
    reactivatePatients,
    sellerClinic: sellerClinic?.clinicName || null,
  };
};
