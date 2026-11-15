import { describe, expect, it } from "vitest";
import type { Idea } from "./types";
import { buildRepeatRow, groupByIdea } from "./memory-data";

describe("groupByIdea", () => {
  it("merges children across multiple rows with the same idea_id and ignores null idea_id/children", () => {
    const grouped = groupByIdea([
      { idea_id: "i1", children: ["a", "b"] },
      { idea_id: "i1", children: ["c"] },
      { idea_id: null, children: ["ignored"] },
      { idea_id: "i2", children: null },
    ]);

    expect(grouped).toEqual({
      i1: ["a", "b", "c"],
    });
  });
});

describe("buildRepeatRow", () => {
  it("clones idea fields with status idea, supplied ctx, preserved thumbnail_path, and no source_external_id", () => {
    const idea: Idea = {
      id: "old-id",
      created_by: "old-user",
      title: "Midnight Ramen",
      notes: "Extra egg",
      category: "food",
      budget: "medium",
      setting: "outdoor",
      duration_minutes: 90,
      status: "done",
      source_url: "https://www.tiktok.com/@u/video/123456789",
      source_type: "tiktok",
      source_external_id: "123456789",
      source_author: "@u",
      source_caption: "Best ramen",
      thumbnail_path: "couple/thumb.jpg",
    };

    const row = buildRepeatRow(idea, {
      coupleId: "c1",
      userId: "u2",
    });

    expect(row).toEqual({
      couple_id: "c1",
      created_by: "u2",
      title: "Midnight Ramen",
      notes: "Extra egg",
      category: "food",
      budget: "medium",
      setting: "outdoor",
      duration_minutes: 90,
      source_url: "https://www.tiktok.com/@u/video/123456789",
      source_type: "tiktok",
      source_author: "@u",
      source_caption: "Best ramen",
      thumbnail_path: "couple/thumb.jpg",
      status: "idea",
    });
    expect("source_external_id" in row).toBe(false);
  });
});
