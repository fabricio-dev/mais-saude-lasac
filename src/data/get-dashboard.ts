import dayjs from "dayjs";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
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

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      id: string;
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartSatartDate = dayjs().subtract(14, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const regeExpiratedDate = dayjs()
    .subtract(90, "days")
    .startOf("day")
    .toDate();
  const regeExpiratedEndDate = dayjs().add(14, "days").endOf("day").toDate();

  // Definindo condições SQL uma única vez para eliminar duplicidade - Priorizando SQL
  const fromDate = dayjs(from).startOf("day").toDate();
  const toDate = dayjs(to).endOf("day").toDate();

  const conveniosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} >= ${fromDate} AND ${patientsTable.activeAt} <= ${toDate} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`;
  const conveniosRenovadosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} >= ${fromDate} AND ${patientsTable.reactivatedAt} <= ${toDate} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`;
  const totalCondition = sql<number>`${conveniosCondition} + ${conveniosRenovadosCondition}`;

  const [
    [totalPatients],
    [totalPatientsRenovated],
    [totalSellers],
    [totalClinics],
    [totalEnterprise],
    [totalEnterpriseRenovated],
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
  ] = await Promise.all([
    // Pacientes ativados pela primeira vez no período
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, fromDate),
          lte(patientsTable.activeAt, toDate),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, fromDate),
          lte(patientsTable.reactivatedAt, toDate),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      ),
    // TODO: Implementa a query para o total de vendedores
    db
      .select({
        total: count(),
      })
      .from(sellersTable)
      .where(
        inArray(
          sellersTable.clinicId,
          db
            .select({ clinicId: usersToClinicsTable.clinicId })
            .from(usersToClinicsTable)
            .where(eq(usersToClinicsTable.userId, session.user.id)),
        ),
      ),
    // TODO: Implementa a query para o total de clinicas
    db
      .select({
        total: count(),
      })
      .from(clinicsTable)
      .where(
        inArray(
          clinicsTable.id,
          db
            .select({ clinicId: usersToClinicsTable.clinicId })
            .from(usersToClinicsTable)
            .where(eq(usersToClinicsTable.userId, session.user.id)),
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
            //pega so o covenios da clinica do usuario logado
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, fromDate),
          lte(patientsTable.activeAt, toDate),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          inArray(
            //pega so o covenios da clinica do usuario logado
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
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
            .where(eq(usersToClinicsTable.userId, session.user.id)),
        ),
      )
      .groupBy(sellersTable.id, clinicsTable.name)
      .orderBy(desc(totalCondition))
      .limit(7),
    // Top clinicas - reutilizando as mesmas condições SQL globais
    db
      .select({
        clinic: clinicsTable.name,
        patients: conveniosCondition.mapWith(Number),
        patientsRenovated: conveniosRenovadosCondition.mapWith(Number),
      })
      .from(patientsTable)
      .innerJoin(clinicsTable, eq(patientsTable.clinicId, clinicsTable.id))
      .where(
        and(
          inArray(
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
          eq(patientsTable.isActive, true),
        ),
      )
      .groupBy(clinicsTable.id)
      .orderBy(desc(totalCondition))
      .limit(12),
    // TODO: Implementa a query para os pacientes que estão para expirar ou exprirados
    db.query.patientsTable.findMany({
      where: and(
        inArray(
          patientsTable.clinicId,
          db
            .select({ clinicId: usersToClinicsTable.clinicId })
            .from(usersToClinicsTable)
            .where(eq(usersToClinicsTable.userId, session.user.id)),
        ),
        gte(patientsTable.expirationDate, regeExpiratedDate),
        lte(patientsTable.expirationDate, regeExpiratedEndDate),
      ),
      with: {
        seller: true,
        clinic: true,
      },
      orderBy: asc(patientsTable.expirationDate),
      limit: 7,
    }),
    // TODO: Implementa a query para os convenios diários dentre um intervalo de 21 dias
    Promise.all([
      // Consulta para pacientes novos (baseado na data de ativacao) ok
      db
        .select({
          date: sql<string>`DATE(${patientsTable.activeAt})`.as("date"),
          count: count(patientsTable.id),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(
              patientsTable.clinicId,
              db
                .select({ clinicId: usersToClinicsTable.clinicId })
                .from(usersToClinicsTable)
                .where(eq(usersToClinicsTable.userId, session.user.id)),
            ),
            gte(patientsTable.activeAt, chartSatartDate),
            lte(patientsTable.activeAt, chartEndDate),
            eq(patientsTable.isActive, true),
          ),
        )
        .groupBy(sql<string>`DATE(${patientsTable.activeAt})`)
        .orderBy(sql<string>`DATE(${patientsTable.activeAt})`),

      // Consulta para pacientes reativados (baseado na data de reativação)
      db
        .select({
          date: sql<string>`DATE(${patientsTable.reactivatedAt})`.as("date"),
          count: count(patientsTable.id),
        })
        .from(patientsTable)
        .where(
          and(
            inArray(
              patientsTable.clinicId,
              db
                .select({ clinicId: usersToClinicsTable.clinicId })
                .from(usersToClinicsTable)
                .where(eq(usersToClinicsTable.userId, session.user.id)),
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
    // Desativar pacientes expirados (apenas data, sem horário)
    db
      .update(patientsTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          lte(patientsTable.expirationDate, dayjs().endOf("day").toDate()),
          eq(patientsTable.isActive, true),
          inArray(
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
        ),
      ),

    // Reativar pacientes inativos com data de expiração válida
    db
      .update(patientsTable)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          gte(patientsTable.expirationDate, dayjs().startOf("day").toDate()),
          eq(patientsTable.isActive, false),
          // Apenas pacientes que já foram ativados pelo menos uma vez
          or(
            isNotNull(patientsTable.activeAt),
            isNotNull(patientsTable.reactivatedAt),
          ),
          inArray(
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
        ),
      ),
  ]);

  return {
    totalPatients,
    totalPatientsRenovated,
    totalSellers,
    totalClinics,
    totalEnterprise,
    totalEnterpriseRenovated,
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
  };
};
