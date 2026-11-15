import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTikTokInput } from "@/lib/links/resolve";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  if (typeof text !== "string") {
    return NextResponse.json({ ok: false, error: "No link found" });
  }

  const result = await resolveTikTokInput(text, supabase, user.id);
  return NextResponse.json(result);
}
