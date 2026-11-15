"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCtx } from "@/lib/auth";
import { fromForm, planSchema, reviewSchema, settingsSchema } from "@/lib/schemas";
import type { FormState } from "./ideas";

export async function createDate(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const p = planSchema.safeParse(fromForm(fd));
  if (!p.success) return { error: "Pick a date and time" };
  const { error } = await ctx.supabase.from("dates").insert({
    couple_id: ctx.coupleId,
    created_by: ctx.user.id,
    idea_id: p.data.idea_id ?? null,
    title: p.data.title,
    scheduled_at: p.data.scheduled_at,
    notes: p.data.notes,
  });
  if (error) return { error: error.message };
  if (p.data.idea_id) {
    await ctx.supabase.from("ideas").update({ status: "planned" }).eq("id", p.data.idea_id);
  }
  revalidatePath("/", "layout");
  redirect("/dates");
}

// done -> idea done; cancelled -> idea returns to the pool
export async function setDateStatus(fd: FormData) {
  const ctx = await getCtx();
  const id = z.string().uuid().parse(fd.get("id"));
  const status = z.enum(["done", "cancelled"]).parse(fd.get("status"));
  const { data } = await ctx.supabase.from("dates").update({ status }).eq("id", id).select("idea_id").single();
  if (data?.idea_id) {
    await ctx.supabase.from("ideas").update({ status: status === "done" ? "done" : "idea" }).eq("id", data.idea_id);
  }
  revalidatePath("/", "layout");
}

export async function upsertReview(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const p = reviewSchema.safeParse(fromForm(fd));
  if (!p.success) return { error: "Choose a rating from 1 to 5" };
  const { error } = await ctx.supabase.from("date_reviews").upsert({
    date_id: p.data.date_id,
    user_id: ctx.user.id,
    rating: p.data.rating,
    note: p.data.note,
    would_repeat: p.data.would_repeat === "on",
  });
  if (error) return { error: error.message };
  revalidatePath(`/dates/${p.data.date_id}`);
  return null;
}

export async function updateSettings(fd: FormData) {
  const ctx = await getCtx();
  const p = settingsSchema.parse(fromForm(fd));
  await ctx.supabase
    .from("couple_settings")
    .update({ nudge_enabled: p.nudge_enabled === "on", nudge_weekday: p.nudge_weekday })
    .eq("couple_id", ctx.coupleId);
  revalidatePath("/settings");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const pw = z.string().min(8, "Use at least 8 characters").safeParse(fd.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  const { error } = await ctx.supabase.auth.updateUser({ password: pw.data });
  return error ? { error: error.message } : { error: "Password updated" };
}

export async function updateDisplayName(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await getCtx();
  const name = z.string().trim().min(1, "Enter a name").max(40).safeParse(fd.get("display_name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ display_name: name.data })
    .eq("id", ctx.user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: "Name saved" };
}
