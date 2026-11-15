import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { getCtx } from "./auth";

type Ctx = Awaited<ReturnType<typeof getCtx>>;

export async function ensureDoneDate(
  ctx: Ctx,
  ideaId: string,
): Promise<string> {
  const { data: existingDate } = await ctx.supabase
    .from("dates")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingDate?.id) {
    return existingDate.id as string;
  }

  const { data: idea, error: ideaErr } = await ctx.supabase
    .from("ideas")
    .select("title")
    .eq("id", ideaId)
    .eq("couple_id", ctx.coupleId)
    .single();

  if (ideaErr || !idea) {
    throw new Error(ideaErr?.message ?? "Idea not found");
  }

  const { data: created, error: insertErr } = await ctx.supabase
    .from("dates")
    .insert({
      couple_id: ctx.coupleId,
      idea_id: ideaId,
      created_by: ctx.user.id,
      title: idea.title,
      status: "done",
    })
    .select("id")
    .single();

  if (insertErr || !created) {
    throw new Error(insertErr?.message ?? "Failed to create date record");
  }

  return created.id as string;
}

export async function signPhotoUrls(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Record<string, string>> {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  if (!uniquePaths.length) return {};

  const { data, error } = await supabase.storage
    .from("date-photos")
    .createSignedUrls(uniquePaths, 3600);

  if (error || !data) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      result[item.path] = item.signedUrl;
    }
  }
  return result;
}
