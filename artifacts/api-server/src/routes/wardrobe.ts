import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, wardrobeItemsTable, outfitsTable } from "@workspace/db";
import {
  CreateWardrobeItemBody,
  UpdateWardrobeItemBody,
  GetWardrobeItemParams,
  UpdateWardrobeItemParams,
  DeleteWardrobeItemParams,
  MarkItemLastWornParams,
  ListWardrobeItemsQueryParams,
} from "@workspace/api-zod";
import { analyzeGaps } from "../lib/gapAdvisor";

const router: IRouter = Router();

function mapItem(item: typeof wardrobeItemsTable.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    primary_color_hex: item.primaryColorHex,
    color_name: item.colorName,
    style_tags: item.styleTags,
    pattern: item.pattern,
    image_url: item.imageUrl ?? null,
    last_worn: item.lastWorn ? item.lastWorn.toISOString() : null,
    times_worn: item.timesWorn,
    created_at: item.createdAt.toISOString(),
  };
}

router.get("/wardrobe", async (req, res): Promise<void> => {
  try {
    const query = ListWardrobeItemsQueryParams.safeParse(req.query);
    const items = await db.select().from(wardrobeItemsTable).orderBy(wardrobeItemsTable.createdAt);

    let filtered = items;
    if (query.success && query.data.category) {
      filtered = filtered.filter((i) => i.category === query.data.category);
    }
    if (query.success && query.data.style) {
      const style = String(query.data.style);
      filtered = filtered.filter((i) => i.styleTags.includes(style));
    }

    res.json(filtered.map(mapItem));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/wardrobe", async (req, res): Promise<void> => {
  try {
    const parsed = CreateWardrobeItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const d = parsed.data;
    const [item] = await db
      .insert(wardrobeItemsTable)
      .values({
        name: d.name,
        brand: d.brand ?? "",
        category: d.category,
        primaryColorHex: d.primary_color_hex,
        colorName: d.color_name ?? "",
        styleTags: d.style_tags ?? [],
        pattern: d.pattern ?? "solid",
        imageUrl: d.image_url ?? null,
      })
      .returning();

    res.status(201).json(mapItem(item));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/wardrobe/:id", async (req, res): Promise<void> => {
  try {
    const params = GetWardrobeItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [item] = await db
      .select()
      .from(wardrobeItemsTable)
      .where(eq(wardrobeItemsTable.id, params.data.id));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(mapItem(item));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.put("/wardrobe/:id", async (req, res): Promise<void> => {
  try {
    const params = UpdateWardrobeItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateWardrobeItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const d = parsed.data;
    const updates: Record<string, unknown> = {};
    if (d.name !== undefined) updates.name = d.name;
    if (d.brand !== undefined) updates.brand = d.brand;
    if (d.category !== undefined) updates.category = d.category;
    if (d.primary_color_hex !== undefined) updates.primaryColorHex = d.primary_color_hex;
    if (d.color_name !== undefined) updates.colorName = d.color_name;
    if (d.style_tags !== undefined) updates.styleTags = d.style_tags;
    if (d.pattern !== undefined) updates.pattern = d.pattern;
    if (d.image_url !== undefined) updates.imageUrl = d.image_url;

    const [item] = await db
      .update(wardrobeItemsTable)
      .set(updates)
      .where(eq(wardrobeItemsTable.id, params.data.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(mapItem(item));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.delete("/wardrobe/:id", async (req, res): Promise<void> => {
  try {
    const params = DeleteWardrobeItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [item] = await db
      .delete(wardrobeItemsTable)
      .where(eq(wardrobeItemsTable.id, params.data.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json({ success: true, id: item.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/wardrobe/:id/last-worn", async (req, res): Promise<void> => {
  try {
    const params = MarkItemLastWornParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(wardrobeItemsTable)
      .where(eq(wardrobeItemsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const [item] = await db
      .update(wardrobeItemsTable)
      .set({ lastWorn: new Date(), timesWorn: existing.timesWorn + 1 })
      .where(eq(wardrobeItemsTable.id, params.data.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    res.json(mapItem(item));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  try {
    const items = await db.select().from(wardrobeItemsTable);
    const outfits = await db.select().from(outfitsTable);

    const savedOutfits = outfits.filter((o) => o.isSaved).length;
    const lastWorn = outfits
      .filter((o) => o.lastWorn)
      .sort((a, b) => (b.lastWorn?.getTime() ?? 0) - (a.lastWorn?.getTime() ?? 0))[0];

    const topScore = outfits.reduce((max, o) => Math.max(max, o.score), 0);

    const itemsByCategory: Record<string, number> = {};
    for (const item of items) {
      itemsByCategory[item.category] = (itemsByCategory[item.category] ?? 0) + 1;
    }

    res.json({
      total_items: items.length,
      total_outfits: outfits.length,
      saved_outfits: savedOutfits,
      last_worn_date: lastWorn?.lastWorn?.toISOString() ?? null,
      top_score: topScore,
      items_by_category: itemsByCategory,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/gap-advisor", async (_req, res): Promise<void> => {
  try {
    const items = await db.select().from(wardrobeItemsTable);
    const result = analyzeGaps(items);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

export default router;
