import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wardrobeItemsTable = pgTable("wardrobe_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brand: text("brand").notNull().default(""),
  category: text("category").notNull(),
  primaryColorHex: text("primary_color_hex").notNull(),
  colorName: text("color_name").notNull().default(""),
  styleTags: text("style_tags").array().notNull().default([]),
  pattern: text("pattern").notNull().default("solid"),
  imageUrl: text("image_url"),
  lastWorn: timestamp("last_worn", { withTimezone: true }),
  timesWorn: integer("times_worn").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWardrobeItemSchema = createInsertSchema(wardrobeItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWardrobeItem = z.infer<typeof insertWardrobeItemSchema>;
export type WardrobeItem = typeof wardrobeItemsTable.$inferSelect;
