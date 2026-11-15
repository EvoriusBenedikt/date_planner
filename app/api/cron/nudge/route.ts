import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // this read doubles as the daily keep-alive for the free Supabase project
  const { data: settings, error } = await db.from("couple_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const s of settings ?? []) {
    if (!s.nudge_enabled || !process.env.TELEGRAM_BOT_TOKEN) continue;
    const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: s.timezone })).getDay();
    if (weekday !== s.nudge_weekday) continue;

    const now = new Date();
    const week = new Date(now.getTime() + 7 * 864e5);
    const { count } = await db.from("dates").select("id", { count: "exact", head: true })
      .eq("couple_id", s.couple_id).eq("status", "planned")
      .gte("scheduled_at", now.toISOString()).lte("scheduled_at", week.toISOString());
    if (count) continue;

    const { data: ideas } = await db.from("ideas").select("title")
      .eq("couple_id", s.couple_id).eq("status", "idea").limit(60);
    const picks = (ideas ?? []).sort(() => Math.random() - 0.5).slice(0, 3).map((i) => `• ${i.title}`);
    const text = `No date planned this week.\n${picks.join("\n") || "Add some ideas first."}\n${process.env.NEXT_PUBLIC_APP_URL ?? ""}`;

    const { data: members } = await db.from("couple_members").select("user_id").eq("couple_id", s.couple_id);
    const { data: profiles } = await db.from("profiles").select("telegram_chat_id")
      .in("id", (members ?? []).map((m) => m.user_id)).not("telegram_chat_id", "is", null);
    for (const p of profiles ?? []) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: p.telegram_chat_id, text, disable_web_page_preview: true }),
      });
      sent++;
    }
  }
  return NextResponse.json({ ok: true, sent });
}
