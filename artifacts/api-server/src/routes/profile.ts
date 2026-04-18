import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userProfileTable } from "@workspace/db";
import { UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateProfile() {
  const profiles = await db.select().from(userProfileTable).limit(1);
  if (profiles.length > 0) return profiles[0];

  const [profile] = await db
    .insert(userProfileTable)
    .values({
      displayName: "Shreeraj",
      skinToneHex: "#CC9674",
      eyeColorHex: "#1F1919",
      hairColorHex: "#0A0B0B",
      skinToneType: "warm-medium",
      stylePreferences: ["casual", "smart-casual", "streetwear"],
    })
    .returning();
  return profile;
}

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json({
    id: profile.id,
    display_name: profile.displayName,
    skin_tone_hex: profile.skinToneHex,
    eye_color_hex: profile.eyeColorHex,
    hair_color_hex: profile.hairColorHex,
    skin_tone_type: profile.skinToneType,
    style_preferences: profile.stylePreferences,
  });
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await getOrCreateProfile();
  const updates: Record<string, unknown> = {};
  if (parsed.data.display_name !== undefined)
    updates.displayName = parsed.data.display_name;
  if (parsed.data.style_preferences !== undefined)
    updates.stylePreferences = parsed.data.style_preferences;

  const [updated] = await db
    .update(userProfileTable)
    .set(updates)
    .where(eq(userProfileTable.id, profile.id))
    .returning();

  res.json({
    id: updated.id,
    display_name: updated.displayName,
    skin_tone_hex: updated.skinToneHex,
    eye_color_hex: updated.eyeColorHex,
    hair_color_hex: updated.hairColorHex,
    skin_tone_type: updated.skinToneType,
    style_preferences: updated.stylePreferences,
  });
});

export default router;
