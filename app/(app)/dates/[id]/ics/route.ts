import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  // RLS returns nothing for non-members, so this doubles as the auth check
  const { data } = await supabase.from("dates").select("id,title,notes,scheduled_at").eq("id", id).maybeSingle();
  if (!data?.scheduled_at) return new Response("Not found", { status: 404 });
  return new Response(buildIcs({ id: data.id, title: data.title, notes: data.notes, start: new Date(data.scheduled_at) }), {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="date.ics"' },
  });
}
