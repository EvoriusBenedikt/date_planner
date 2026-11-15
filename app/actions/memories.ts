"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCtx } from "@/lib/auth";
import { ensureDoneDate } from "@/lib/memories";
import { buildRepeatRow } from "@/lib/memory-data";
import type { Idea } from "@/lib/types";

export async function prepareDatePhoto(
  ideaId: string,
): Promise<{ coupleId: string; dateId: string } | { error: string }> {
  const ctx = await getCtx();
  const parsed = z.string().uuid().safeParse(ideaId);
  if (!parsed.success) return { error: "Invalid idea id" };

  try {
    const dateId = await ensureDoneDate(ctx, parsed.data);
    return { coupleId: ctx.coupleId, dateId };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Could not prepare photo upload",
    };
  }
}

export async function recordDatePhoto(
  dateId: string,
  storagePath: string,
): Promise<{ error?: string }> {
  const ctx = await getCtx();
  const parsedDateId = z.string().uuid().safeParse(dateId);
  if (!parsedDateId.success) return { error: "Invalid date id" };

  const expectedPrefix = `${ctx.coupleId}/${parsedDateId.data}/`;
  if (!storagePath.startsWith(expectedPrefix) || storagePath.includes("..")) {
    return { error: "Invalid photo path" };
  }

  const { error } = await ctx.supabase.from("date_photos").insert({
    date_id: parsedDateId.data,
    couple_id: ctx.coupleId,
    uploaded_by: ctx.user.id,
    storage_path: storagePath,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function repeatIdea(fd: FormData): Promise<void> {
  const ctx = await getCtx();
  const ideaId = z.string().uuid().parse(fd.get("idea_id"));

  const { data: source, error: loadErr } = await ctx.supabase
    .from("ideas")
    .select("*, idea_tags(tag_id)")
    .eq("id", ideaId)
    .eq("couple_id", ctx.coupleId)
    .single();

  if (loadErr || !source) {
    throw new Error(loadErr?.message ?? "Idea not found");
  }

  const row = buildRepeatRow(source as Idea, {
    coupleId: ctx.coupleId,
    userId: ctx.user.id,
  });

  const { data: created, error: insertErr } = await ctx.supabase
    .from("ideas")
    .insert(row)
    .select("id")
    .single();

  if (insertErr || !created) {
    throw new Error(insertErr?.message ?? "Could not repeat idea");
  }

  const tagIds = (
    (source.idea_tags as { tag_id: string }[] | null) ?? []
  ).map((t) => t.tag_id);

  if (tagIds.length > 0) {
    await ctx.supabase.from("idea_tags").insert(
      tagIds.map((tag_id) => ({
        idea_id: created.id as string,
        tag_id,
      })),
    );
  }

  revalidatePath("/", "layout");
}
