import dayjs from "dayjs";
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { clinicsTable, patientsTable, sellersTable } from "@/db/schema";

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

export const getDashboardGestor = async ({ from, to, session }: Params) => {
  const chartSatartDate = dayjs().subtract(14, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const regeExpiratedDate = dayjs()
    .subtract(90, "days")
    .startOf("day")
    .toDate();
  const regeExpiratedEndDate = dayjs().add(14, "days").endOf("day").toDate();

  // Definindo condições SQL para convenios novos e renovações da clínica do gestor
  const conveniosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.activeAt} >= ${new Date(from)} AND ${patientsTable.activeAt} <= ${new Date(to)} AND ${patientsTable.activeAt} IS NOT NULL THEN 1 END)`;
  const conveniosRenovadosCondition = sql<number>`COUNT(CASE WHEN ${patientsTable.reactivatedAt} >= ${new Date(from)} AND ${patientsTable.reactivatedAt} <= ${new Date(to)} AND ${patientsTable.reactivatedAt} IS NOT NULL THEN 1 END)`;
  const totalCondition = sql<number>`${conveniosCondition} + ${conveniosRenovadosCondition}`;

  const [
    [totalPatients],
    [totalPatientsRenovated],
    [totalSellers],
    [totalEnterprise],
    [totalEnterpriseRenovated],
    [gestorClinic],
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
  ] = await Promise.all([
    // Pacientes ativados pela primeira vez no período na clínica do gestor
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
              .select({ clinicId: sellersTable.clinicId })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, new Date(from)),
          lte(patientsTable.activeAt, new Date(to)),
        ),
      ),

    // Pacientes renovados no período na clínica do gestor
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
              .select({ clinicId: sellersTable.clinicId })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.isActive, true),
          gte(patientsTable.reactivatedAt, new Date(from)),
          lte(patientsTable.reactivatedAt, new Date(to)),
          sql`${patientsTable.reactivatedAt} IS NOT NULL`,
        ),
      ),

    // Total de vendedores da clínica do gestor
    db
      .select({
        total: count(),
      })
      .from(sellersTable)
      .where(
        inArray(
          sellersTable.clinicId,
          db
            .select({ clinicId: sellersTable.clinicId })
            .from(sellersTable)
            .where(eq(sellersTable.email, session.user.email)),
        ),
      ),

    // Total de pacientes empresariais novos da clínica do gestor
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
              .select({ clinicId: sellersTable.clinicId })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
          eq(patientsTable.cardType, "enterprise"),
          eq(patientsTable.isActive, true),
          gte(patientsTable.activeAt, new Date(from)),
          lte(patientsTable.activeAt, new Date(to)),
        ),
      ),

    // Total de pacientes empresariais renovados da clínica do gestor
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
              .select({ clinicId: sellersTable.clinicId })
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

    // Informações da clínica do gestor
    db
      .select({
        clinicName: clinicsTable.name,
      })
      .from(clinicsTable)
      .where(
        inArray(
          clinicsTable.id,
          db
            .select({ clinicId: sellersTable.clinicId })
            .from(sellersTable)
            .where(eq(sellersTable.email, session.user.email)),
        ),
      )
      .limit(1),

    // Top vendedores da clínica do gestor
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
            .select({ clinicId: sellersTable.clinicId })
            .from(sellersTable)
            .where(eq(sellersTable.email, session.user.email)),
        ),
      )
      .groupBy(sellersTable.id, clinicsTable.name)
      .orderBy(desc(totalCondition))
      .limit(10),

    // Pacientes da clínica do gestor que estão para expirar
    db.query.patientsTable.findMany({
      where: and(
        inArray(
          patientsTable.clinicId,
          db
            .select({ clinicId: sellersTable.clinicId })
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

    // Dados diários de convenios da clínica do gestor
    Promise.all([
      // Consulta para pacientes novos da clínica (baseado na data de ativacao)
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
                .select({ clinicId: sellersTable.clinicId })
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

      // Consulta para pacientes reativados da clínica (baseado na data de reativação)
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
                .select({ clinicId: sellersTable.clinicId })
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

    // Desativar pacientes expirados da clínica do gestor
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
              .select({ clinicId: sellersTable.clinicId })
              .from(sellersTable)
              .where(eq(sellersTable.email, session.user.email)),
          ),
        ),
      ),
  ]);

  return {
    totalPatients,
    totalPatientsRenovated,
    totalSellers,
    totalEnterprise,
    totalEnterpriseRenovated,
    gestorClinic: gestorClinic?.clinicName || null,
    topSellers,
    patientsToExpire,
    dailyConveniosData,
    deactivatePatients,
  };
};
