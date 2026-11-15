import { getCtx } from "@/lib/auth";
import { IdeasBrowser } from "@/components/ideas-browser";
import { signPhotoUrls } from "@/lib/memories";
import { groupByIdea } from "@/lib/memory-data";
import type { Idea, IdeaPhoto, IdeaReview } from "@/lib/types";

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
      .select(
        "idea_id, date_reviews(user_id, rating, note, would_repeat), date_photos(id, storage_path)",
      )
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

  const dateRows = (doneDatesData ?? []) as {
    idea_id: string | null;
    date_reviews: IdeaReview[] | null;
    date_photos: { id: string; storage_path: string }[] | null;
  }[];

  const reviewsByIdeaId = groupByIdea(
    dateRows.map((d) => ({ idea_id: d.idea_id, children: d.date_reviews })),
  );

  const rawPhotosByIdeaId = groupByIdea(
    dateRows.map((d) => ({ idea_id: d.idea_id, children: d.date_photos })),
  );
  const allPaths = Object.values(rawPhotosByIdeaId)
    .flat()
    .map((p) => p.storage_path);
  const signedMap = await signPhotoUrls(supabase, allPaths);
  const photosByIdeaId: Record<string, IdeaPhoto[]> = {};
  for (const [ideaId, items] of Object.entries(rawPhotosByIdeaId)) {
    const signed = items
      .map((p) => ({
        id: p.id,
        storage_path: p.storage_path,
        url: signedMap[p.storage_path] ?? "",
      }))
      .filter((p) => Boolean(p.url));
    if (signed.length) photosByIdeaId[ideaId] = signed;
  }

  return (
    <IdeasBrowser
      ideas={ideas}
      profilesById={profilesById}
      likedIds={likedIds}
      matchIds={matchIds}
      reviewsByIdeaId={reviewsByIdeaId}
      photosByIdeaId={photosByIdeaId}
      currentUserId={user.id}
    />
  );
}
