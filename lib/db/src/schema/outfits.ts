import { pgTable, text, uuid, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outfitsTable = pgTable("outfits", {
  id: uuid("id").primaryKey().defaultRandom(),
  topId: uuid("top_id").notNull(),
  bottomId: uuid("bottom_id").notNull(),
  shoesId: uuid("shoes_id").notNull(),
  jacketId: uuid("jacket_id"),
  score: integer("score").notNull(),
  scoreBreakdown: jsonb("score_breakdown").notNull(),
  isSaved: boolean("is_saved").notNull().default(false),
  lastWorn: timestamp("last_worn", { withTimezone: true }),
  timesWorn: integer("times_worn").notNull().default(0),
  aiExplanation: text("ai_explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOutfitSchema = createInsertSchema(outfitsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type Outfit = typeof outfitsTable.$inferSelect;
