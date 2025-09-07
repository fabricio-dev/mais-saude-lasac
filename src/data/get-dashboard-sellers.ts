import dayjs from "dayjs";
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  clinicsTable,
  patientsTable,
  sellersTable,
  usersToClinicsTable,
} from "@/db/schema";

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

  const chartSatartDate = dayjs().subtract(14, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const regeExpiratedDate = dayjs()
    .subtract(90, "days")
    .startOf("day")
    .toDate();
  const regeExpiratedEndDate = dayjs().add(14, "days").endOf("day").toDate();

  const conveniosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} >= ${new Date(from)} AND ${patientsTable.activeAt} <= ${new Date(to)} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`;
  const conveniosRenovadosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} >= ${new Date(from)} AND ${patientsTable.reactivatedAt} <= ${new Date(to)} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`;
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
          gte(patientsTable.activeAt, new Date(from)),
          lte(patientsTable.activeAt, new Date(to)),
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
          gte(patientsTable.reactivatedAt, new Date(from)),
          lte(patientsTable.reactivatedAt, new Date(to)),
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
          gte(patientsTable.activeAt, new Date(from)),
          lte(patientsTable.activeAt, new Date(to)),
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
          gte(patientsTable.reactivatedAt, new Date(from)),
          lte(patientsTable.reactivatedAt, new Date(to)),
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
      db
        .select({
          date: sql<string>`DATE(${patientsTable.activeAt})`.as("date"),
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
        .groupBy(sql<string>`DATE(${patientsTable.activeAt})`)
        .orderBy(sql<string>`DATE(${patientsTable.activeAt})`),

      // Consulta para pacientes reativados do vendedor logado (baseado na data de reativação)
      db
        .select({
          date: sql<string>`DATE(${patientsTable.reactivatedAt})`.as("date"),
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
        .groupBy(sql<string>`DATE(${patientsTable.reactivatedAt})`)
        .orderBy(sql<string>`DATE(${patientsTable.reactivatedAt})`),
    ]).then(([novosData, renovadosData]) => {
      // Criar mapa de todas as datas no período
      const currentDate = dayjs(chartSatartDate);
      const endDate = dayjs(chartEndDate);
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
    // Desativar pacientes expirados do vendedor logado
    db
      .update(patientsTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          lte(patientsTable.expirationDate, new Date()),
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
    sellerClinic: sellerClinic?.clinicName || null,
  };
};
