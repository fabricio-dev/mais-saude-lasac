import dayjs from "dayjs";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
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
  const [
    [totalPatients],
    [totalSellers],
    [totalClinics],
    [totalEnterprise],
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
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
            patientsTable.clinicId,
            db
              .select({ clinicId: usersToClinicsTable.clinicId })
              .from(usersToClinicsTable)
              .where(eq(usersToClinicsTable.userId, session.user.id)),
          ),
          eq(patientsTable.isActive, true),
          or(
            // Pacientes ativados pela primeira vez no período
            and(
              gte(patientsTable.activeAt, new Date(from)),
              lte(patientsTable.activeAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NULL`,
            ),
            // Pacientes reativados no período
            and(
              gte(patientsTable.reactivatedAt, new Date(from)),
              lte(patientsTable.reactivatedAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NOT NULL`,
            ),
          ),
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
          gte(patientsTable.activeAt, new Date(from)),
          lte(patientsTable.activeAt, new Date(to)),
        ),
      ),

    // TODO: Implementa a query para os top vendedores
    db
      .select({
        id: sellersTable.id,
        name: sellersTable.name,
        avatarImageUrl: sellersTable.avatarImageUrl,
        clinic: clinicsTable.name,
        convenios: count(patientsTable.id),
      })
      .from(sellersTable)
      .innerJoin(clinicsTable, eq(sellersTable.clinicId, clinicsTable.id))
      .leftJoin(
        patientsTable,
        and(
          eq(sellersTable.id, patientsTable.sellerId),
          eq(patientsTable.isActive, true),
          or(
            // Pacientes ativados pela primeira vez no período
            and(
              gte(patientsTable.activeAt, new Date(from)),
              lte(patientsTable.activeAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NULL`,
            ),
            // Pacientes reativados no período
            and(
              gte(patientsTable.reactivatedAt, new Date(from)),
              lte(patientsTable.reactivatedAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NOT NULL`,
            ),
          ),
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
      .orderBy(desc(count(patientsTable.id)))
      .limit(10),
    // TODO: Implementa a query para os top 12 clinicas
    db
      .select({
        clinic: clinicsTable.name,
        patients: count(patientsTable.id),
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
          or(
            // Pacientes ativados pela primeira vez no período
            and(
              gte(patientsTable.activeAt, new Date(from)),
              lte(patientsTable.activeAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NULL`,
            ),
            // Pacientes reativados no período
            and(
              gte(patientsTable.reactivatedAt, new Date(from)),
              lte(patientsTable.reactivatedAt, new Date(to)),
              sql`${patientsTable.reactivatedAt} IS NOT NULL`,
            ),
          ),
        ),
      )
      .groupBy(clinicsTable.id)
      .orderBy(desc(count(patientsTable.id)))
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
      limit: 15,
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
            sql`${patientsTable.reactivatedAt} IS NULL`,
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
    // TODO: Implementa a query para desativar os pacientes que estão para expirar ou exprirados
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
    totalSellers,
    totalClinics,
    totalEnterprise,
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
  };
};
