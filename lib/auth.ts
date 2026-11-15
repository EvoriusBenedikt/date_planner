import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Session + couple membership gate. Memoized per-request so layout + page share one lookup.
// Proxy already validates/refreshes the session via getUser(), so reading getSession() avoids a duplicate Auth round-trip.
export const getCtx = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) redirect("/login");
  const { data: m } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!m) redirect("/not-authorized");
  return { supabase, user, coupleId: m.couple_id as string };
});

export { thumbUrl } from "@/lib/types";
