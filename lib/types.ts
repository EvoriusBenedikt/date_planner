export type IdeaReview = {
  user_id: string;
  rating: number | null;
  note: string | null;
  would_repeat: boolean | null;
};

export type IdeaPhoto = {
  id: string;
  storage_path: string;
  url: string;
};

export type Idea = {
  id: string;
  created_by: string;
  title: string;
  notes: string | null;
  status: "idea" | "planned" | "done" | "archived";
  source_url: string | null;
  source_type: string;
  source_external_id: string | null;
  source_author: string | null;
  source_caption: string | null;
  thumbnail_path: string | null;
  category: string | null;
  budget: "free" | "low" | "medium" | "high" | null;
  setting: "indoor" | "outdoor" | "either" | null;
  duration_minutes: number | null;
  idea_tags?: { tags: { name: string } | null }[];
};

export type DateRow = {
  id: string;
  idea_id: string | null;
  title: string;
  scheduled_at: string | null;
  status: "planned" | "done" | "cancelled";
  notes: string | null;
};

export const BUDGETS = ["free", "low", "medium", "high"] as const;
export const SETTINGS = ["indoor", "outdoor", "either"] as const;

export function thumbUrl(path: string | null) {
  return path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`
    : null;
}
