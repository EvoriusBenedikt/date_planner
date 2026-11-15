import { z } from "zod";

// Empty form fields arrive as "", treat them as missing.
export const fromForm = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].map(([k, v]) => [k, v === "" ? undefined : v]));

export const ideaSchema = z.object({
  title: z.string().trim().min(1, "Give it a title").max(200),
  notes: z.string().trim().optional(),
  category: z.string().trim().optional(),
  budget: z.enum(["free", "low", "medium", "high"]).optional(),
  setting: z.enum(["indoor", "outdoor", "either"]).default("either"),
  duration_minutes: z.coerce.number().int().positive().optional(),
  location_name: z.string().trim().optional(),
  tags: z.string().optional(),
  source_url: z.string().url().optional(),
  source_type: z.enum(["tiktok", "instagram", "youtube", "maps", "other", "none"]).default("none"),
  source_external_id: z.string().optional(),
  source_author: z.string().optional(),
  source_caption: z.string().optional(),
  thumbnail_path: z.string().optional(),
});

export const planSchema = z.object({
  idea_id: z.string().uuid().optional(),
  title: z.string().trim().min(1),
  scheduled_at: z.string().datetime(),
  notes: z.string().trim().optional(),
});

export const reviewSchema = z.object({
  date_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().optional(),
  would_repeat: z.string().optional(),
});

export const settingsSchema = z.object({
  nudge_enabled: z.string().optional(),
  nudge_weekday: z.coerce.number().int().min(0).max(6),
});
