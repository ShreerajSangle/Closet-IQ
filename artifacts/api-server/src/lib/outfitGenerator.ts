import { WardrobeItem } from "@workspace/db";

export interface ScoreBreakdown {
  color_harmony: number;
  skin_tone_affinity: number;
  style_coherence: number;
  occasion_match: number;
  layering_bonus: number;
  total: number;
}

export interface GeneratedOutfit {
  topId: string;
  bottomId: string;
  shoesId: string;
  jacketId: string | null;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

const SKIN_TONE_HEX = "#CC9674";
const SKIN_H = 27;
const SKIN_S = 0.43;
const SKIN_L = 0.62;

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s, l };
}

function isNeutral(hex: string): boolean {
  const { s } = hexToHsl(hex);
  return s < 0.15;
}

function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

function colorHarmonyScore(topHex: string, bottomHex: string): number {
  const topNeutral = isNeutral(topHex);
  const bottomNeutral = isNeutral(bottomHex);

  if (topNeutral || bottomNeutral) return 95;

  const top = hexToHsl(topHex);
  const bottom = hexToHsl(bottomHex);
  const dist = hueDistance(top.h, bottom.h);

  if (dist <= 30) return 85;
  if (dist >= 150 && dist <= 210) return 90;
  return 50;
}

function skinToneAffinityScore(itemHex: string): number {
  const { h, s, l } = hexToHsl(itemHex);

  if (isNeutral(itemHex)) {
    if (l < 0.3) return 90;
    if (l > 0.85) return 82;
    return 85;
  }

  const dist = hueDistance(h, SKIN_H);

  if (
    (h >= 25 && h <= 50) ||
    (h >= 200 && h <= 230) ||
    (h >= 30 && h <= 45 && s > 0.2 && l > 0.4)
  ) {
    return 90;
  }

  if (l > 0.75 && s < 0.3) return 75;
  if (s < 0.3 && l > 0.8) return 72;

  return 78;
}

function styleCoherenceScore(top: WardrobeItem, bottom: WardrobeItem, shoes: WardrobeItem): number {
  const allTags = [
    ...(top.styleTags ?? []),
    ...(bottom.styleTags ?? []),
    ...(shoes.styleTags ?? []),
  ];

  const hasFormal = allTags.some((t) => t === "formal" || t === "smart-casual" || t === "business");
  const hasCasual = allTags.some((t) => t === "casual" || t === "streetwear");

  const topTags = new Set(top.styleTags ?? []);
  const bottomTags = new Set(bottom.styleTags ?? []);
  const shoesTags = new Set(shoes.styleTags ?? []);

  const allUnique = new Set([...topTags, ...bottomTags, ...shoesTags]);
  const shared = [...topTags].filter((t) => bottomTags.has(t) || shoesTags.has(t));

  if (hasFormal && hasCasual) return 65;
  if (shared.length >= 2) return 90;
  if (shared.length >= 1) return 82;

  return 75;
}

function occasionMatchScore(top: WardrobeItem, bottom: WardrobeItem, shoes: WardrobeItem): number {
  const allTags = [
    ...(top.styleTags ?? []),
    ...(bottom.styleTags ?? []),
    ...(shoes.styleTags ?? []),
  ];

  const tagSet = new Set(allTags);

  const hasEdgy = tagSet.has("edgy");
  const hasCasual = tagSet.has("casual");
  const hasSmart = tagSet.has("smart-casual");
  const hasStreet = tagSet.has("streetwear");

  if (hasSmart && hasCasual) return 80;
  if (hasSmart) return 88;
  if (hasCasual || hasStreet) return 85;
  if (hasEdgy) return 82;

  return 78;
}

type LayerInfo = {
  penalty: number;
  bonus: number;
};

function canLayer(top: WardrobeItem, jacket: WardrobeItem): LayerInfo {
  const topCat = top.category;
  const jacketCat = jacket.category;

  if (jacketCat === "jacket") {
    const topPattern = (top.pattern ?? "solid").toLowerCase();
    const jacketColorName = (jacket.colorName ?? "").toLowerCase();
    const topColorName = (top.colorName ?? "").toLowerCase();

    const isLeather = jacketColorName.includes("brown") || jacketColorName.includes("leather") || jacketColorName.includes("black");
    const isDenim = jacketColorName.includes("grey") || jacketColorName.includes("blue") || jacketColorName.includes("denim");

    if (topCat === "shirt" || topCat === "tshirt") {
      if (topPattern === "graphic" && !isLeather) {
        return { penalty: 15, bonus: 0 };
      }
      if ((topPattern === "stripe" || topPattern === "plaid")) {
        const jacketPattern = (jacket.pattern ?? "solid").toLowerCase();
        if (jacketPattern === "stripe" || jacketPattern === "plaid") {
          return { penalty: 20, bonus: 0 };
        }
      }
      if (topCat === "shirt" && topColorName.includes("linen") && isDenim) {
        return { penalty: 10, bonus: 0 };
      }
      return { penalty: 0, bonus: 5 };
    }
  }

  return { penalty: 0, bonus: 0 };
}

function calculateScore(
  top: WardrobeItem,
  bottom: WardrobeItem,
  shoes: WardrobeItem,
  jacket?: WardrobeItem
): { score: number; breakdown: ScoreBreakdown } {
  const colorHarmony = colorHarmonyScore(top.primaryColorHex, bottom.primaryColorHex);
  const skinToneAffinity = Math.round(
    (skinToneAffinityScore(top.primaryColorHex) +
      skinToneAffinityScore(bottom.primaryColorHex)) /
      2
  );
  const styleCoherence = styleCoherenceScore(top, bottom, shoes);
  const occasionMatch = occasionMatchScore(top, bottom, shoes);

  let layeringBonus = 0;
  let layeringPenalty = 0;
  if (jacket) {
    const layer = canLayer(top, jacket);
    layeringBonus = layer.bonus;
    layeringPenalty = layer.penalty;
  }

  const rawTotal =
    colorHarmony * 0.4 +
    skinToneAffinity * 0.25 +
    styleCoherence * 0.2 +
    occasionMatch * 0.15 +
    layeringBonus -
    layeringPenalty;

  const total = Math.max(0, Math.min(100, Math.round(rawTotal)));

  return {
    score: total,
    breakdown: {
      color_harmony: Math.round(colorHarmony),
      skin_tone_affinity: Math.round(skinToneAffinity),
      style_coherence: Math.round(styleCoherence),
      occasion_match: Math.round(occasionMatch),
      layering_bonus: layeringBonus - layeringPenalty,
      total,
    },
  };
}

export function generateOutfits(items: WardrobeItem[]): GeneratedOutfit[] {
  const tops = items.filter((i) => i.category === "shirt" || i.category === "tshirt");
  const bottoms = items.filter(
    (i) => i.category === "pants" || i.category === "jeans" || i.category === "shorts"
  );
  const shoes = items.filter((i) => i.category === "shoes");
  const jackets = items.filter((i) => i.category === "jacket");

  const outfits: GeneratedOutfit[] = [];
  const seen = new Set<string>();

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const baseKey = `${top.id}-${bottom.id}-${shoe.id}`;

        const { score, breakdown } = calculateScore(top, bottom, shoe);

        if (score >= 60) {
          if (!seen.has(baseKey)) {
            seen.add(baseKey);
            outfits.push({
              topId: top.id,
              bottomId: bottom.id,
              shoesId: shoe.id,
              jacketId: null,
              score,
              scoreBreakdown: breakdown,
            });
          }
        }

        for (const jacket of jackets) {
          const layeredKey = `${top.id}-${bottom.id}-${shoe.id}-${jacket.id}`;
          const { score: layeredScore, breakdown: layeredBreakdown } = calculateScore(
            top,
            bottom,
            shoe,
            jacket
          );

          if (layeredScore >= 60 && !seen.has(layeredKey)) {
            seen.add(layeredKey);
            outfits.push({
              topId: top.id,
              bottomId: bottom.id,
              shoesId: shoe.id,
              jacketId: jacket.id,
              score: layeredScore,
              scoreBreakdown: layeredBreakdown,
            });
          }
        }
      }
    }
  }

  return outfits.sort((a, b) => b.score - a.score);
}
