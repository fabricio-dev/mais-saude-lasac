import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
});

export const clinicsTable = pgTable("clinics", {
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
  cpfNumber: varchar("cpf_number", { length: 11 }).notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  address: text("address").notNull(),
  homeNumber: text("home_number").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
    onDelete: "cascade",
  }),
});

export const patientsSexEnum = pgEnum("patients_sex", ["male", "female"]);
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
  rgNumber: varchar("rg_number", { length: 11 }).notNull(),
  cpfNumber: varchar("cpf_number", { length: 11 }).notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  homeNumber: text("home_number").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  sex: patientsSexEnum("sex").notNull(), //limitar a 2 valores aplicar en demais tabelas o enum
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),

  clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
    onDelete: "cascade",
  }),
  // fazer enum para clinicas listando as clinicas
  cardType: typeCardEnum("card_type").notNull(),
  numberCards: integer("number_cards").notNull(),
  sellerId: uuid("seller_id").references(() => sellersTable.id, {
    onDelete: "cascade",
  }),
  dependents1: text("dependents1"),
  dependents2: text("dependents2"),
  dependents3: text("dependents3"),
  dependents4: text("dependents4"),
  dependents5: text("dependents5"),
  expirationDate: timestamp("expiration_date").notNull(), // estudar como fazer o campo ser automaticamente atualizado para um ano a mais
  statusAgreement: statusAgreementEnum("status_agreement").notNull(),
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

export const sellersTableRelation = relations(sellersTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [sellersTable.clinicId],
    references: [clinicsTable.id],
  }),
}));

export const patientsTableRelation = relations(patientsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [patientsTable.clinicId],
    references: [clinicsTable.id],
  }),
  seller: one(sellersTable, {
    fields: [patientsTable.sellerId],
    references: [sellersTable.id],
  }),
}));

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: uuid("user_id")
    .references(() => usersTable.id)
    .notNull(),
  clinicId: uuid("clinic_id")
    .references(() => clinicsTable.id)
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
