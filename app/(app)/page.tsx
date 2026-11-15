import { getCtx } from "@/lib/auth";
import { IdeasBrowser } from "@/components/ideas-browser";
import type { Idea, IdeaReview } from "@/lib/types";

export default async function Home() {
  const { supabase, user, coupleId } = await getCtx();

  const [
    { data: ideasData },
    { data: profilesData },
    { data: swipesData },
    { data: matchesData },
    { data: doneDatesData },
  ] = await Promise.all([
    supabase
      .from("ideas")
      .select("*, idea_tags(tags(name))")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name"),
    supabase
      .from("swipes")
      .select("idea_id")
      .eq("user_id", user.id)
      .eq("vote", "like"),
    supabase.rpc("get_matches", { p_couple: coupleId }),
    supabase
      .from("dates")
      .select("idea_id, date_reviews(user_id, rating, note, would_repeat)")
      .not("idea_id", "is", null),
  ]);

  const ideas = (ideasData ?? []) as Idea[];
  const profilesById: Record<string, string> = {};
  for (const p of (profilesData ?? []) as { id: string; display_name: string }[]) {
    profilesById[p.id] = p.display_name;
  }

  const likedIds = ((swipesData ?? []) as { idea_id: string }[]).map(
    (s) => s.idea_id,
  );
  const matchIds = ((matchesData ?? []) as { id: string }[]).map((m) => m.id);

  const reviewsByIdeaId: Record<string, IdeaReview[]> = {};
  for (const d of (doneDatesData ?? []) as {
    idea_id: string | null;
    date_reviews: IdeaReview[];
  }[]) {
    if (d.idea_id && d.date_reviews?.length) {
      reviewsByIdeaId[d.idea_id] = d.date_reviews;
    }
  }

  return (
    <IdeasBrowser
      ideas={ideas}
      profilesById={profilesById}
      likedIds={likedIds}
      matchIds={matchIds}
      reviewsByIdeaId={reviewsByIdeaId}
      currentUserId={user.id}
    />
  );
}
