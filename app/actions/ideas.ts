"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCtx } from "@/lib/auth";
import { resolveTikTokInput } from "@/lib/links/resolve";
import { extractUrl } from "@/lib/links/tiktok";
import { fromForm, ideaSchema } from "@/lib/schemas";

export type FormState = { error?: string } | null;

type Ctx = Awaited<ReturnType<typeof getCtx>>;

async function saveTags(ctx: Ctx, ideaId: string, raw: string | undefined) {
  const names = [...new Set((raw ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
  await ctx.supabase.from("idea_tags").delete().eq("idea_id", ideaId);
  if (!names.length) return;
  const { data: tags } = await ctx.supabase
    .from("tags")
    .upsert(names.map((name) => ({ couple_id: ctx.coupleId, name })), { onConflict: "couple_id,name" })
    .select("id");
  if (tags?.length) {
    await ctx.supabase.from("idea_tags").insert(tags.map((t) => ({ idea_id: ideaId, tag_id: t.id })));
  }
}

function parse(fd: FormData) {
  const parsed = ideaSchema.safeParse(fromForm(fd));
  return parsed.success
    ? { data: parsed.data }
    : { error: parsed.error.issues[0]?.message ?? "Invalid input" };
}

const fail = (error: { code?: string; message: string }): FormState =>
  ({ error: error.code === "23505" ? "You already saved this one" : error.message });

export async function createIdea(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const p = parse(fd);
  if (!p.data) return { error: p.error };
  const { tags, ...row } = p.data;
  const { data, error } = await ctx.supabase
    .from("ideas")
    .insert({ ...row, couple_id: ctx.coupleId, created_by: ctx.user.id })
    .select("id")
    .single();
  if (error) return fail(error);
  await saveTags(ctx, data.id, tags);
  revalidatePath("/");
  redirect("/");
}

export async function quickCreateIdea(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const raw = String(fd.get("text") ?? "").trim();
  if (!raw) return { error: "Paste a link or type an idea" };

  const foundUrl = extractUrl(raw);
  let row: Record<string, unknown> = {
    couple_id: ctx.coupleId,
    created_by: ctx.user.id,
    title: raw.slice(0, 200),
    source_type: "none",
  };

  if (foundUrl) {
    const res = await resolveTikTokInput(raw, ctx.supabase, ctx.user.id);
    if (res.ok) {
      row = {
        couple_id: ctx.coupleId,
        created_by: ctx.user.id,
        title: (res.title || "TikTok date idea").slice(0, 200),
        source_url: res.sourceUrl,
        source_type: "tiktok",
        source_external_id: res.externalId,
        source_author: res.author,
        source_caption: res.caption,
        thumbnail_path: res.thumbnailPath,
      };
    } else {
      const textWithoutUrl = raw.replace(foundUrl, "").trim();
      row = {
        couple_id: ctx.coupleId,
        created_by: ctx.user.id,
        title: (textWithoutUrl || foundUrl).slice(0, 200),
        source_url: foundUrl,
        source_type: "other",
      };
    }
  }

  const { error } = await ctx.supabase.from("ideas").insert(row);
  if (error) return fail(error);
  revalidatePath("/");
  return null;
}

export async function updateIdea(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const p = parse(fd);
  if (!p.data) return { error: p.error };
  const { tags, ...row } = p.data;
  const { error } = await ctx.supabase.from("ideas").update(row).eq("id", z.string().uuid().parse(id));
  if (error) return fail(error);
  await saveTags(ctx, id, tags);
  revalidatePath("/");
  redirect("/");
}

export async function setIdeaStatus(fd: FormData) {
  const ctx = await getCtx();
  const id = z.string().uuid().parse(fd.get("id"));
  const status = z.enum(["idea", "planned", "done", "archived"]).parse(fd.get("status"));
  await ctx.supabase.from("ideas").update({ status }).eq("id", id);
  revalidatePath("/");
}

export async function toggleLikeIdea(fd: FormData) {
  const ctx = await getCtx();
  const ideaId = z.string().uuid().parse(fd.get("idea_id"));
  const { data: existing } = await ctx.supabase
    .from("swipes")
    .select("vote")
    .eq("idea_id", ideaId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (existing?.vote === "like") {
    await ctx.supabase
      .from("swipes")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", ctx.user.id);
  } else {
    await ctx.supabase.from("swipes").upsert({
      idea_id: ideaId,
      user_id: ctx.user.id,
      vote: "like",
    });
  }
  revalidatePath("/");
}

export async function saveIdeaMemory(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const ideaId = z.string().uuid().parse(fd.get("idea_id"));
  const rating = z.coerce.number().int().min(1).max(5).safeParse(fd.get("rating"));
  if (!rating.success) return { error: "Pick a rating from 1 to 5" };
  const note = String(fd.get("note") ?? "").trim() || null;
  const wouldRepeat = fd.get("would_repeat") === "on";

  const { data: existingDate } = await ctx.supabase
    .from("dates")
    .select("id")
    .eq("idea_id", ideaId)
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let dateId = existingDate?.id as string | undefined;
  if (!dateId) {
    const { data: idea } = await ctx.supabase
      .from("ideas")
      .select("title")
      .eq("id", ideaId)
      .single();
    const { data: created, error: createErr } = await ctx.supabase
      .from("dates")
      .insert({
        couple_id: ctx.coupleId,
        idea_id: ideaId,
        created_by: ctx.user.id,
        title: idea?.title ?? "Date",
        status: "done",
      })
      .select("id")
      .single();
    if (createErr || !created) return { error: createErr?.message ?? "Could not save memory" };
    dateId = created.id;
  }

  const { error } = await ctx.supabase.from("date_reviews").upsert({
    date_id: dateId,
    user_id: ctx.user.id,
    rating: rating.data,
    note,
    would_repeat: wouldRepeat,
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  return null;
}

export async function deleteIdea(fd: FormData) {
  const ctx = await getCtx();
  await ctx.supabase.from("ideas").delete().eq("id", z.string().uuid().parse(fd.get("id")));
  revalidatePath("/");
  redirect("/");
}
