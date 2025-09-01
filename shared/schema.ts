import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users: any = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: varchar("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalReferrals: integer("total_referrals").notNull().default(0),
  hasPlayedOnce: boolean("has_played_once").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  referredBy: varchar("referred_by").references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredId: varchar("referred_id").notNull().references(() => users.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  rewardPaid: boolean("reward_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: jsonb("payment_details"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
});

export const uniqueCodes = pgTable("unique_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  code: varchar("code", { length: 14 }).notNull().unique(),
  imageUrl: text("image_url"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  welcomeMessage: text("welcome_message").notNull(),
  welcomePhotoUrl: text("welcome_photo_url"),
  playButtonUrl: text("play_button_url").notNull(),
  newUserBonus: decimal("new_user_bonus", { precision: 10, scale: 2 }).notNull().default("1.00"),
  referralReward: decimal("referral_reward", { precision: 10, scale: 2 }).notNull().default("0.10"),
  minWithdrawal: decimal("min_withdrawal", { precision: 10, scale: 2 }).notNull().default("1.00"),
  referralsForCode: integer("referrals_for_code").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // new_user, referral_complete, withdrawal_request, code_generated
  userId: varchar("user_id").references(() => users.id),
  data: jsonb("data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  withdrawals: many(withdrawals),
  uniqueCodes: many(uniqueCodes),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

export const uniqueCodesRelations = relations(uniqueCodes, ({ one }) => ({
  user: one(users, {
    fields: [uniqueCodes.userId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  totalReferrals: true,
  hasPlayedOnce: true,
  isBlocked: true,
  joinedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  status: true,
  requestedAt: true,
  processedAt: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Referral = typeof referrals.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type UniqueCode = typeof uniqueCodes.$inferSelect;
export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
