import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfileTable = pgTable("user_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull().default("Shreeraj"),
  skinToneHex: text("skin_tone_hex").notNull().default("#CC9674"),
  eyeColorHex: text("eye_color_hex").notNull().default("#1F1919"),
  hairColorHex: text("hair_color_hex").notNull().default("#0A0B0B"),
  skinToneType: text("skin_tone_type").notNull().default("warm-medium"),
  stylePreferences: text("style_preferences").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
