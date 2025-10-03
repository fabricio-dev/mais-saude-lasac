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
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
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

  // Definindo condições SQL uma única vez para eliminar duplicidade - Considerando fuso horário brasileiro
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
    deactivateNullExpirationPatients,
    reactivatePatients,
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
        .groupBy(
          sql<string>`DATE(${patientsTable.activeAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        )
        .orderBy(
          sql<string>`DATE(${patientsTable.activeAt} AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')`,
        ),

      // Consulta para pacientes reativados (baseado na data de reativação)
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
    // Desativar pacientes expirados (usando UTC)
    db
      .update(patientsTable)
      .set({
        isActive: false,
      })
      .where(
        and(
          lte(
            patientsTable.expirationDate,
            dayjs().utc().endOf("day").toDate(),
          ),
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

    // Desativar pacientes com data de expiração nula ou vazia
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
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
        ),
      ),

    // Reativar pacientes inativos com data de expiração válida (usando UTC)
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
    deactivateNullExpirationPatients,
    reactivatePatients,
  };
};
