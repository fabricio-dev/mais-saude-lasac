import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
// schema para autenticação

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
// schema para o sistema
export const clinicsTable = pgTable("clinics", {
  //ao excluir usuario a clinica permanesce
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* table  vendedor */
export const sellersTable = pgTable("sellers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  cpfNumber: text("cpf_number").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  unity: text("unity").notNull(),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
    onDelete: "cascade",
  }),
});

export const typeCardEnum = pgEnum("type_card", ["enterprise", "personal"]);

export const statusAgreementEnum = pgEnum("status_agreement", [
  "expired",
  "active",
  "pending", //pendente de assinatura para cliente que se auto cadastrar
]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  birthDate: date("birth_date").notNull(),
  rgNumber: text("rg_number").notNull(),
  cpfNumber: text("cpf_number").notNull(),

  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  homeNumber: text("home_number").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),

  cardType: typeCardEnum("card_type").notNull(),
  Enterprise: text("enterprise"),
  numberCards: integer("number_cards").notNull(),
  sellerId: uuid("seller_id").references(() => sellersTable.id),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id),
  dependents1: text("dependents1"),
  dependents2: text("dependents2"),
  dependents3: text("dependents3"),
  dependents4: text("dependents4"),
  dependents5: text("dependents5"),
  expirationDate: timestamp("expiration_date"), // estudar como fazer o campo ser automaticamente atualizado para um ano a mais
  statusAgreement: statusAgreementEnum("status_agreement"),
  observation: text("observation"),
  isActive: boolean("is_active").notNull().default(true),
  activeAt: timestamp("active_at"),
  reactivatedAt: timestamp("reactivated_at"),
});

/* 


export const agreementTable = pgTable("agreements", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").references(() => sellerTable.id, {
    onDelete: "cascade",
  }),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
    onDelete: "cascade",
  }),
  patientId: uuid("patient_id").references(() => patientTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
*/

//relacoes entre tabelas

export const clinicsTableRelation = relations(clinicsTable, ({ many }) => ({
  sellers: many(sellersTable),
  patients: many(patientsTable),
  usersToClinics: many(usersToClinicsTable),
}));

export const sellersTableRelation = relations(
  sellersTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [sellersTable.clinicId],
      references: [clinicsTable.id],
    }),
    patients: many(patientsTable),
  }),
);

export const patientsTableRelation = relations(patientsTable, ({ one }) => ({
  seller: one(sellersTable, {
    fields: [patientsTable.sellerId],
    references: [sellersTable.id],
  }),
  clinic: one(clinicsTable, {
    fields: [patientsTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  clinicId: uuid("clinic_id")
    .references(() => clinicsTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersTableRelation = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const usersToClinicsTableRelation = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);
