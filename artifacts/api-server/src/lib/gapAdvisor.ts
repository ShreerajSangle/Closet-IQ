import { WardrobeItem } from "@workspace/db";

export interface ColorGap {
  color_name: string;
  hex: string;
  reason: string;
  priority: string;
}

export interface GapRecommendation {
  category: string;
  color_name: string;
  color_hex: string;
  reason: string;
  estimated_outfits_unlocked: number;
  priority: string;
}

export interface GapAdvisorResult {
  missing_categories: string[];
  color_gaps: ColorGap[];
  recommendations: GapRecommendation[];
  coverage_score: number;
}

const SKIN_TONE_HEX = "#CC9674";

const RECOMMENDED_COLORS = [
  { name: "cream white", hex: "#F5F0E8", complements: "warm medium skin" },
  { name: "navy", hex: "#1B2A4A", complements: "warm earth tones" },
  { name: "olive", hex: "#6B7C4A", complements: "warm skin undertone" },
  { name: "camel", hex: "#C19A6B", complements: "analogous to skin tone" },
  { name: "warm grey", hex: "#8A8880", complements: "neutral base" },
  { name: "burgundy", hex: "#722F37", complements: "deep contrast with warm skin" },
  { name: "forest green", hex: "#2D5016", complements: "earthy complement" },
];

const ALL_CATEGORIES = ["shirt", "tshirt", "pants", "jeans", "shorts", "shoes", "jacket"];
const REQUIRED_CATEGORIES = ["shirt", "pants", "shoes"];

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

function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

export function analyzeGaps(items: WardrobeItem[]): GapAdvisorResult {
  const existingCategories = new Set(items.map((i) => i.category));
  const missingCategories = REQUIRED_CATEGORIES.filter((c) => !existingCategories.has(c));

  const existingColors = items.map((i) => hexToHsl(i.primaryColorHex));
  const skinHsl = hexToHsl(SKIN_TONE_HEX);

  const colorGaps: ColorGap[] = [];
  for (const rec of RECOMMENDED_COLORS) {
    const recHsl = hexToHsl(rec.hex);
    const alreadyHave = existingColors.some(
      (c) => hueDistance(c.h, recHsl.h) < 20 && Math.abs(c.l - recHsl.l) < 0.15
    );
    if (!alreadyHave) {
      colorGaps.push({
        color_name: rec.name,
        hex: rec.hex,
        reason: `${rec.name} ${rec.complements} and fills a gap in your palette`,
        priority: rec.name === "cream white" || rec.name === "navy" ? "high" : "medium",
      });
    }
  }

  const recommendations: GapRecommendation[] = [];

  const tops = items.filter((i) => i.category === "shirt" || i.category === "tshirt");
  const bottoms = items.filter(
    (i) => i.category === "pants" || i.category === "jeans" || i.category === "shorts"
  );
  const shoesItems = items.filter((i) => i.category === "shoes");
  const jacketItems = items.filter((i) => i.category === "jacket");

  if (colorGaps.length > 0) {
    const topGap = colorGaps.find((c) => c.priority === "high") ?? colorGaps[0];
    const estimatedNew = tops.length * Math.max(bottoms.length, 1);
    recommendations.push({
      category: shoesItems.length < 2 ? "shoes" : "shirt",
      color_name: topGap.color_name,
      color_hex: topGap.hex,
      reason: `A ${topGap.color_name} piece would complement your skin tone beautifully and unlock ${estimatedNew}+ new combinations`,
      estimated_outfits_unlocked: estimatedNew,
      priority: "high",
    });
  }

  if (jacketItems.length === 0) {
    recommendations.push({
      category: "jacket",
      color_name: "tan",
      color_hex: "#C4A882",
      reason: "A neutral jacket unlocks layered outfits across your entire wardrobe",
      estimated_outfits_unlocked: tops.length * bottoms.length * shoesItems.length,
      priority: "high",
    });
  }

  if (bottoms.length < 3) {
    recommendations.push({
      category: "pants",
      color_name: "navy",
      color_hex: "#1B2A4A",
      reason: "Navy trousers pair with virtually every top in your wardrobe",
      estimated_outfits_unlocked: tops.length * Math.max(shoesItems.length, 1),
      priority: "medium",
    });
  }

  const totalPossibleCategories = ALL_CATEGORIES.length;
  const coveredCategories = existingCategories.size;
  const colorVarietyScore = Math.min(100, (items.length / 15) * 60);
  const categoryScore = (coveredCategories / totalPossibleCategories) * 40;
  const coverageScore = Math.round(colorVarietyScore + categoryScore);

  return {
    missing_categories: missingCategories,
    color_gaps: colorGaps,
    recommendations,
    coverage_score: Math.min(100, coverageScore),
  };
}
