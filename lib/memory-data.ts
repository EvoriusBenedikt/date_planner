import type { Idea } from "./types";

export function groupByIdea<T>(
  rows: { idea_id: string | null; children: T[] | null }[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const row of rows) {
    if (!row.idea_id || !row.children?.length) continue;
    const existing = grouped[row.idea_id];
    if (existing) {
      existing.push(...row.children);
    } else {
      grouped[row.idea_id] = [...row.children];
    }
  }
  return grouped;
}

export function buildRepeatRow(
  idea: Idea,
  ctx: { coupleId: string; userId: string },
): Record<string, unknown> {
  return {
    couple_id: ctx.coupleId,
    created_by: ctx.userId,
    title: idea.title,
    notes: idea.notes,
    category: idea.category,
    budget: idea.budget,
    setting: idea.setting,
    duration_minutes: idea.duration_minutes,
    source_url: idea.source_url,
    source_type: idea.source_type,
    source_author: idea.source_author,
    source_caption: idea.source_caption,
    thumbnail_path: idea.thumbnail_path,
    status: "idea",
  };
}
