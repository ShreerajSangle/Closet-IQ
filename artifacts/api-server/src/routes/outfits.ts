import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, outfitsTable, wardrobeItemsTable } from "@workspace/db";
import {
  SaveOutfitParams,
  UnsaveOutfitParams,
  MarkOutfitWornParams,
  ExplainOutfitParams,
  ListOutfitsQueryParams,
} from "@workspace/api-zod";
import { generateOutfits } from "../lib/outfitGenerator";
import { explainOutfit } from "../lib/groqExplainer";

const router: IRouter = Router();

type DbOutfit = typeof outfitsTable.$inferSelect;
type DbItem = typeof wardrobeItemsTable.$inferSelect;

function mapItem(item: DbItem) {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    primary_color_hex: item.primaryColorHex,
    color_name: item.colorName,
    image_url: item.imageUrl ?? null,
    pattern: item.pattern,
  };
}

function mapOutfit(
  outfit: DbOutfit,
  itemsMap: Map<string, DbItem>
) {
  const top = itemsMap.get(outfit.topId);
  const bottom = itemsMap.get(outfit.bottomId);
  const shoes = itemsMap.get(outfit.shoesId);
  const jacket = outfit.jacketId ? itemsMap.get(outfit.jacketId) : null;

  if (!top || !bottom || !shoes) return null;

  return {
    id: outfit.id,
    top: mapItem(top),
    bottom: mapItem(bottom),
    shoes: mapItem(shoes),
    jacket: jacket ? mapItem(jacket) : null,
    score: outfit.score,
    score_breakdown: outfit.scoreBreakdown as Record<string, number>,
    is_saved: outfit.isSaved,
    last_worn: outfit.lastWorn ? outfit.lastWorn.toISOString() : null,
    times_worn: outfit.timesWorn,
    ai_explanation: outfit.aiExplanation ?? null,
    created_at: outfit.createdAt.toISOString(),
  };
}

router.post("/outfits/generate", async (_req, res): Promise<void> => {
  try {
    const items = await db.select().from(wardrobeItemsTable);
    const generated = generateOutfits(items);

    const existingOutfits = await db.select().from(outfitsTable);
    const existingKeys = new Set(
      existingOutfits.map(
        (o) => `${o.topId}-${o.bottomId}-${o.shoesId}-${o.jacketId ?? "null"}`
      )
    );

    const toInsert = generated.filter((g) => {
      const key = `${g.topId}-${g.bottomId}-${g.shoesId}-${g.jacketId ?? "null"}`;
      return !existingKeys.has(key);
    });

    if (toInsert.length > 0) {
      await db.insert(outfitsTable).values(
        toInsert.map((g) => ({
          topId: g.topId,
          bottomId: g.bottomId,
          shoesId: g.shoesId,
          jacketId: g.jacketId ?? null,
          score: g.score,
          scoreBreakdown: g.scoreBreakdown,
          isSaved: false,
          timesWorn: 0,
        }))
      );
    }

    const allOutfits = await db
      .select()
      .from(outfitsTable)
      .orderBy(desc(outfitsTable.score));

    const itemsMap = new Map(items.map((i) => [i.id, i]));
    const mapped = allOutfits.map((o) => mapOutfit(o, itemsMap)).filter(Boolean);

    res.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/outfits", async (req, res): Promise<void> => {
  try {
    const query = ListOutfitsQueryParams.safeParse(req.query);

    const allOutfits = await db
      .select()
      .from(outfitsTable)
      .orderBy(desc(outfitsTable.score));

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));

    let filtered = allOutfits;

    if (query.success) {
      if (query.data.saved_only) {
        filtered = filtered.filter((o) => o.isSaved);
      }
      if (query.data.min_score !== undefined) {
        filtered = filtered.filter((o) => o.score >= (query.data.min_score ?? 0));
      }
    }

    const mapped = filtered.map((o) => mapOutfit(o, itemsMap)).filter(Boolean);
    res.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/outfits/:id/save", async (req, res): Promise<void> => {
  try {
    const params = SaveOutfitParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [outfit] = await db
      .update(outfitsTable)
      .set({ isSaved: true })
      .where(eq(outfitsTable.id, params.data.id))
      .returning();

    if (!outfit) {
      res.status(404).json({ error: "Outfit not found" });
      return;
    }

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));
    res.json(mapOutfit(outfit, itemsMap));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/outfits/:id/unsave", async (req, res): Promise<void> => {
  try {
    const params = UnsaveOutfitParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [outfit] = await db
      .update(outfitsTable)
      .set({ isSaved: false })
      .where(eq(outfitsTable.id, params.data.id))
      .returning();

    if (!outfit) {
      res.status(404).json({ error: "Outfit not found" });
      return;
    }

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));
    res.json(mapOutfit(outfit, itemsMap));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/outfits/:id/worn", async (req, res): Promise<void> => {
  try {
    const params = MarkOutfitWornParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(outfitsTable)
      .where(eq(outfitsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Outfit not found" });
      return;
    }

    const [outfit] = await db
      .update(outfitsTable)
      .set({ lastWorn: new Date(), timesWorn: existing.timesWorn + 1 })
      .where(eq(outfitsTable.id, params.data.id))
      .returning();

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));
    res.json(mapOutfit(outfit, itemsMap));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.post("/outfits/:id/explain", async (req, res): Promise<void> => {
  try {
    const params = ExplainOutfitParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [outfit] = await db
      .select()
      .from(outfitsTable)
      .where(eq(outfitsTable.id, params.data.id));

    if (!outfit) {
      res.status(404).json({ error: "Outfit not found" });
      return;
    }

    if (outfit.aiExplanation) {
      res.json({ explanation: outfit.aiExplanation, cached: true });
      return;
    }

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));

    const top = itemsMap.get(outfit.topId);
    const bottom = itemsMap.get(outfit.bottomId);
    const shoes = itemsMap.get(outfit.shoesId);
    const jacket = outfit.jacketId ? itemsMap.get(outfit.jacketId) : null;

    if (!top || !bottom || !shoes) {
      res.status(404).json({ error: "Outfit items not found" });
      return;
    }

    const explanation = await explainOutfit({
      topName: top.name,
      topColor: top.colorName,
      bottomName: bottom.name,
      bottomColor: bottom.colorName,
      shoesName: shoes.name,
      shoesColor: shoes.colorName,
      jacketName: jacket?.name,
      jacketColor: jacket?.colorName,
      score: outfit.score,
    });

    await db
      .update(outfitsTable)
      .set({ aiExplanation: explanation })
      .where(eq(outfitsTable.id, outfit.id));

    res.json({ explanation, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/outfits/history", async (_req, res): Promise<void> => {
  try {
    const wornOutfits = await db
      .select()
      .from(outfitsTable)
      .orderBy(desc(outfitsTable.lastWorn));

    const filtered = wornOutfits.filter((o) => o.lastWorn !== null);

    const items = await db.select().from(wardrobeItemsTable);
    const itemsMap = new Map(items.map((i) => [i.id, i]));

    const result = filtered
      .map((o) => {
        const mapped = mapOutfit(o, itemsMap);
        if (!mapped) return null;
        return {
          outfit_id: o.id,
          worn_date: o.lastWorn!.toISOString(),
          outfit: mapped,
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

export default router;
