import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
// schema para autenticação

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
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
  impersonatedBy: text("impersonated_by"),
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
  percentage: integer("percentage").notNull().default(10),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type"),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
    onDelete: "cascade",
  }),
});

export const typeCardEnum = pgEnum("type_card", ["enterprise", "personal"]);

export const statusAgreementEnum = pgEnum("status_agreement", [
  "expired", //contrato expirado
  "pending", //pendente de assinatura para cliente que se auto cadastrar
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "pix",
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
]);

export const priceOperationEnum = pgEnum("price_operation", [
  "activation", // ativação (primeira adesão)
  "renewal", // renovação (inclui renovação antecipada)
]);

// Tabela de preços por operação × tipo de cartão (4 combinações)
export const cardPricesTable = pgTable(
  "card_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    operation: priceOperationEnum("operation").notNull(),
    cardType: typeCardEnum("card_type").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_card_price_operation_card_type").on(
      table.operation,
      table.cardType,
    ),
  ],
);

// Histórico de alterações de preços — 1 registro a cada mudança de valor
export const cardPriceHistoryTable = pgTable("card_price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  cardPriceId: uuid("card_price_id")
    .notNull()
    .references(() => cardPricesTable.id, { onDelete: "cascade" }),
  // Snapshot da combinação para o histórico ser autossuficiente
  operation: priceOperationEnum("operation").notNull(),
  cardType: typeCardEnum("card_type").notNull(),
  previousAmountInCents: integer("previous_amount_in_cents"), // null na primeira definição
  newAmountInCents: integer("new_amount_in_cents").notNull(),
  changedByUserId: text("changed_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  birthDate: date("birth_date"),
  rgNumber: text("rg_number"),
  cpfNumber: text("cpf_number"), // Permite vazio no banco, mas validação obrigatória nos formulários
  phoneNumber: text("phone_number").notNull(),
  address: text("address"),
  homeNumber: text("home_number"),
  city: text("city"),
  state: text("state"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),

  cardType: typeCardEnum("card_type").notNull(),
  Enterprise: text("enterprise"),
  numberCards: integer("number_cards"),
  sellerId: uuid("seller_id").references(() => sellersTable.id),
  clinicId: uuid("clinic_id").references(() => clinicsTable.id),
  dependents1: text("dependents1"),
  dependents2: text("dependents2"),
  dependents3: text("dependents3"),
  dependents4: text("dependents4"),
  dependents5: text("dependents5"),
  dependents6: text("dependents6"),
  expirationDate: timestamp("expiration_date"), // estudar como fazer o campo ser automaticamente atualizado para um ano a mais
  statusAgreement: statusAgreementEnum("status_agreement"),
  observation: text("observation"),
  isActive: boolean("is_active").notNull().default(true),
  activeAt: timestamp("active_at"),
  reactivatedAt: timestamp("reactivated_at"),
  whatsappConsent: boolean("whatsapp_consent").notNull().default(true),
  paymentType: paymentTypeEnum("payment_type"), // tipo do último pagamento (nullable: convênios antigos não têm o dado)
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "RENEWAL_D_7",
  "RENEWAL_D_0",
  // Quem não recebeu o D0 no dia (cron fora do ar): "venceu em {{data}}".
  "RENEWAL_D_0_LATE",
  "RENEWAL_D_30",
]);

export const whatsappNotificationStatusEnum = pgEnum(
  "whatsapp_notification_status",
  ["pending", "sent", "failed"],
);

export const whatsappNotificationsTable = pgTable(
  "whatsapp_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => patientsTable.id, { onDelete: "cascade" }),

    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinicsTable.id, { onDelete: "cascade" }),

    notificationType: notificationTypeEnum("notification_type").notNull(),

    templateName: text("template_name").notNull(),

    status: whatsappNotificationStatusEnum("status")
      .notNull()
      .default("pending"),

    sentAt: timestamp("sent_at"),

    // Por que ficou 'failed': telefone inválido ou paciente descadastrado no
    // atendimento. Falha passageira não chega aqui — a trava é desfeita.
    failureReason: text("failure_reason"),

    createdAt: timestamp("created_at").notNull().defaultNow(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_patient_notification").on(
      table.patientId,
      table.notificationType,
    ),
  ],
);

/**
 * Configuração dos envios de WhatsApp, editada em /whatsapp. Uma linha só
 * (id "default"); enquanto ela não existe, valem os padrões do .env
 * (src/data/whatsapp-settings.ts).
 */
export const whatsappSettingsTable = pgTable("whatsapp_settings", {
  id: text("id").primaryKey().default("default"),
  enabled: boolean("enabled").notNull().default(false),
  reminderD7Enabled: boolean("reminder_d7_enabled").notNull().default(true),
  reminderD0Enabled: boolean("reminder_d0_enabled").notNull().default(true),
  // "Venceu em {{data}}" — só depois de o template ser aprovado na Meta.
  reminderD0LateEnabled: boolean("reminder_d0_late_enabled")
    .notNull()
    .default(false),
  reminderD30Enabled: boolean("reminder_d30_enabled").notNull().default(true),
  d30DailyLimit: integer("d30_daily_limit").notNull().default(100),
  // Número do wa.me nos lembretes, como o cadastro: DDD + número.
  officialNumber: text("official_number"),
  // Hora cheia (0–23, São Paulo) em que o cron dispara os lembretes.
  sendHour: integer("send_hour").notNull().default(9),
  // Dias da semana (0 = domingo … 6 = sábado).
  sendDays: integer("send_days")
    .array()
    .notNull()
    .default([0, 1, 2, 3, 4, 5, 6]),
  // Dia (São Paulo) da última execução — o cron roda de hora em hora e só
  // dispara uma vez por dia.
  lastRunOn: date("last_run_on", { mode: "string" }),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedByUserId: text("updated_by_user_id").references(() => usersTable.id),
});

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * A lista de parceiros em PDF enviada depois da ativação. No banco, e não em
 * public/: arquivo posto em public/ depois do build não é servido em produção.
 * Servida em /arquivos/lista-de-parceiros.pdf.
 */
export const partnersListFileTable = pgTable("partners_list_file", {
  id: text("id").primaryKey().default("default"),
  content: bytea("content").notNull(),
  fileName: text("file_name").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedByUserId: text("updated_by_user_id").references(() => usersTable.id),
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
  whatsappNotifications: many(whatsappNotificationsTable),
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

export const patientsTableRelation = relations(
  patientsTable,
  ({ one, many }) => ({
    seller: one(sellersTable, {
      fields: [patientsTable.sellerId],
      references: [sellersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    whatsappNotifications: many(whatsappNotificationsTable),
  }),
);

export const whatsappNotificationsRelations = relations(
  whatsappNotificationsTable,
  ({ one }) => ({
    patient: one(patientsTable, {
      fields: [whatsappNotificationsTable.patientId],
      references: [patientsTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [whatsappNotificationsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

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

export const cardPricesTableRelation = relations(
  cardPricesTable,
  ({ many }) => ({
    history: many(cardPriceHistoryTable),
  }),
);

export const cardPriceHistoryTableRelation = relations(
  cardPriceHistoryTable,
  ({ one }) => ({
    cardPrice: one(cardPricesTable, {
      fields: [cardPriceHistoryTable.cardPriceId],
      references: [cardPricesTable.id],
    }),
    changedBy: one(usersTable, {
      fields: [cardPriceHistoryTable.changedByUserId],
      references: [usersTable.id],
    }),
  }),
);
