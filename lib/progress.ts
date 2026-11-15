import "server-only";
import { cache } from "react";
import { getCtx } from "./auth";
import {
  computeProgress,
  type Progress,
  type ProgressInput,
} from "./gamification";

export const getProgress = cache(async (): Promise<Progress> => {
  const { supabase } = await getCtx();

  const [
    { data: ideas },
    { data: dates },
    { data: reviews },
    { data: photos },
  ] = await Promise.all([
    supabase.from("ideas").select("id, status, created_by"),
    supabase.from("dates").select("id, idea_id, status"),
    supabase
      .from("date_reviews")
      .select("date_id, user_id, rating, would_repeat"),
    supabase.from("date_photos").select("date_id"),
  ]);

  return computeProgress({
    ideas: (ideas ?? []) as ProgressInput["ideas"],
    dates: (dates ?? []) as ProgressInput["dates"],
    reviews: (reviews ?? []) as ProgressInput["reviews"],
    photos: (photos ?? []) as ProgressInput["photos"],
  });
});
