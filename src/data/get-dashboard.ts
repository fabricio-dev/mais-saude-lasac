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
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartSatartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const regeExpiratedDate = dayjs()
    .subtract(90, "days")
    .startOf("day")
    .toDate();
  const regeExpiratedEndDate = dayjs().add(7, "days").endOf("day").toDate();
  const [
    [totalPatients],
    [totalSellers],
    [totalClinics],
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
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
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
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
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
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
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
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
    db
      .select({
        date: sql<string>`DATE(${patientsTable.createdAt})`.as("date"),
        convenios: count(patientsTable.id),
        faturamento: sql<number>`COALESCE(COUNT(${patientsTable.id}), 0)`.as(
          "faturamento",
        ),
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
          gte(patientsTable.createdAt, chartSatartDate),
          lte(patientsTable.createdAt, chartEndDate),
        ),
      )
      .groupBy(sql<string>`DATE(${patientsTable.createdAt})`)
      .orderBy(sql<string>`DATE(${patientsTable.createdAt})`),
  ]);

  return {
    totalPatients,
    totalSellers,
    totalClinics,
    topSellers,
    topClinics,
    patientsToExpire,
    dailyConveniosData,
  };
};
