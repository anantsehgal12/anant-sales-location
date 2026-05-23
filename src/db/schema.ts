import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  date,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const callTypeEnum = pgEnum("call_type", [
  "Fresh",
  "Follow-Up",
  "Service",
  "Recharge Related",
  "Any Other",
]);

export const discussionForEnum = pgEnum("discussion_for", [
  "DTH",
  "Internet",
  "TollFree Service",
  "SIP Trunk",
  "Any Other",
]);

export const dthProviderEnum = pgEnum("dth_provider", [
  "Airtel",
  "Jio",
  "Tata Play",
  "Dish TV",
  "Videocon",
  "Local Operators",
  "Any Other",
]);

export const internetProviderEnum = pgEnum("internet_provider", [
  "Airtel",
  "Jio",
  "VI",
  "Tata Play",
  "Local Operators",
  "Any Other",
]);

export const callTemperatureEnum = pgEnum("call_temperature", ["Hot", "Cold"]);

export const orgSegmentEnum = pgEnum("org_segment", [
  "SME",
  "Enterprise",
  "Government",
  "Education",
  "Healthcare",
  "Hospitality",
  "Any Other",
]);

// ─────────────────────────────────────────────
// 1. EXECUTIVES  (identity managed by Clerk)
// ─────────────────────────────────────────────

export const executives = pgTable("executives", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  clerkUserId: varchar("clerk_user_id", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// 2. ORGANISATIONS
// ─────────────────────────────────────────────

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  orgName: varchar("org_name", { length: 512 }).notNull(),
  orgSegment: orgSegmentEnum("org_segment"),
  orgArea: varchar("org_area", { length: 256 }),
  orgPincode: varchar("org_pincode", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// 3. LEADS
// ─────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom().unique(),

  // ── Foreign keys ──────────────────────────
  executiveId: uuid("executive_id")
    .notNull()
    .references(() => executives.id, { onDelete: "restrict" }),
  organisationId: uuid("organisation_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  // ── Visit details ─────────────────────────
  visitDate: date("visit_date").notNull(),
  callType: callTypeEnum("call_type").notNull(),

  // Location stored as lat/lng pair
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),

  // ── Contact at the organisation ───────────
  contactPersonName: varchar("contact_person_name", { length: 256 }),
  contactPersonDesignationDept: varchar("contact_person_designation_dept", {
    length: 256,
  }),
  contactPersonPhone: varchar("contact_person_phone", { length: 20 }),

  // ── Discussion ────────────────────────────
  discussionFor: discussionForEnum("discussion_for").notNull(),

  // ── Current providers ─────────────────────
  currentProviderDth: dthProviderEnum("current_provider_dth"),
  currentProviderInternet: internetProviderEnum("current_provider_internet"),

  // ── Commercial details ────────────────────
  noOfConnections: integer("no_of_connections"),
  currentRentalPlan: varchar("current_rental_plan", { length: 256 }),
  totalMonthlyExpenses: decimal("total_monthly_expenses", {
    precision: 12,
    scale: 2,
  }),

  // ── Outcome ───────────────────────────────
  callTemperature: callTemperatureEnum("call_temperature"),
  nextFollowUpDate: date("next_follow_up_date"),
  finalRemarks: text("final_remarks"),

  // ── Timestamps ────────────────────────────
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const executivesRelations = relations(executives, ({ many }) => ({
  leads: many(leads),
}));

export const organisationsRelations = relations(organisations, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  executive: one(executives, {
    fields: [leads.executiveId],
    references: [executives.id],
  }),
  organisation: one(organisations, {
    fields: [leads.organisationId],
    references: [organisations.id],
  }),
}));

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────

export type Executive = typeof executives.$inferSelect;
export type NewExecutive = typeof executives.$inferInsert;

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;