import dayjs from "dayjs";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable, patientsTable, sellersTable } from "@/db/schema";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
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
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(
        and(
          eq(patientsTable.clinicId, session.user.clinic.id),
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(sellersTable)
      .where(eq(sellersTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(clinicsTable)
      .where(eq(clinicsTable.id, session.user.clinic.id)),
    db
      .select({
        id: sellersTable.id,
        name: sellersTable.name,
        avatarImageUrl: sellersTable.avatarImageUrl,
        clinic: sql<string>`${sellersTable.clinicId}`.as("clinic"),
        convenios: count(patientsTable.id),
      })
      .from(sellersTable)
      .leftJoin(
        patientsTable,
        and(
          eq(sellersTable.id, patientsTable.sellerId),
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
        ),
      )
      .where(eq(sellersTable.clinicId, session.user.clinic.id))
      .groupBy(sellersTable.id)
      .orderBy(desc(count(patientsTable.id)))
      .limit(5),
    db
      .select({
        clinic: clinicsTable.name,
        patients: count(patientsTable.id),
      })
      .from(patientsTable)
      .innerJoin(clinicsTable, eq(patientsTable.clinicId, clinicsTable.id))
      .where(
        and(
          eq(patientsTable.clinicId, session.user.clinic.id),
          gte(patientsTable.createdAt, new Date(from)),
          lte(patientsTable.createdAt, new Date(to)),
        ),
      )
      .groupBy(clinicsTable.id)
      .orderBy(desc(count(patientsTable.id)))
      .limit(5),
    db.query.patientsTable.findMany({
      where: and(
        eq(patientsTable.clinicId, session.user.clinic.id),
        gte(patientsTable.expirationDate, regeExpiratedDate),
        lte(patientsTable.expirationDate, regeExpiratedEndDate),
      ),
      with: {
        seller: true,
        clinic: true,
      },
      orderBy: asc(patientsTable.expirationDate),
      limit: 30,
    }),
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
          eq(patientsTable.clinicId, session.user.clinic.id),
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
