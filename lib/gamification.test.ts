import { describe, expect, it } from "vitest";
import {
  computeProgress,
  levelFromXp,
  levelThreshold,
  type ProgressInput,
} from "./gamification";

const emptyInput: ProgressInput = {
  ideas: [],
  dates: [],
  reviews: [],
  photos: [],
};

describe("levelThreshold", () => {
  it("returns 0, 100, 300, 600 for levels 1 to 4", () => {
    expect(levelThreshold(1)).toBe(0);
    expect(levelThreshold(2)).toBe(100);
    expect(levelThreshold(3)).toBe(300);
    expect(levelThreshold(4)).toBe(600);
  });
});

describe("levelFromXp", () => {
  it("maps XP boundaries to the right level", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
  });
});

describe("computeProgress", () => {
  it("handles an empty couple with zero XP, level 1, 0%, and all milestones locked", () => {
    const res = computeProgress(emptyInput);
    expect(res.xp).toBe(0);
    expect(res.level).toBe(1);
    expect(res.title).toBe("Spark");
    expect(res.xpIntoLevel).toBe(0);
    expect(res.xpForNextLevel).toBe(100);
    expect(res.pct).toBe(0);
    expect(Number.isNaN(res.pct)).toBe(false);
    expect(res.doneCount).toBe(0);
    expect(res.photoCount).toBe(0);
    expect(res.fiveStarCount).toBe(0);
    expect(res.milestones.every((m) => m.unlocked === false)).toBe(true);
  });

  it("awards +100 XP for 1 done idea", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
    });
    expect(res.xp).toBe(100);
    expect(res.level).toBe(2);
    expect(res.title).toBe("Explorers");
    expect(res.doneCount).toBe(1);
    expect(res.milestones.find((m) => m.id === "first-date")?.unlocked).toBe(
      true,
    );
  });

  it("awards +150 XP for 1 done idea and 2 reviews", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
      dates: [{ id: "d1", idea_id: "i1", status: "done" }],
      reviews: [
        { date_id: "d1", user_id: "u1", rating: 4, would_repeat: false },
        { date_id: "d1", user_id: "u2", rating: 4, would_repeat: false },
      ],
    });
    expect(res.xp).toBe(150);
  });

  it("caps photo XP at 2 photos per date (3 photos on one date add 50 XP)", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
      dates: [{ id: "d1", idea_id: "i1", status: "done" }],
      photos: [{ date_id: "d1" }, { date_id: "d1" }, { date_id: "d1" }],
    });
    expect(res.xp).toBe(150);
    expect(res.photoCount).toBe(3);
    expect(
      res.milestones.find((m) => m.id === "picture-perfect")?.unlocked,
    ).toBe(true);
  });

  it("adds +20 bonus and unlocks five-star-hit and storytellers when two users rate 5 on one date", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
      dates: [{ id: "d1", idea_id: "i1", status: "done" }],
      reviews: [
        { date_id: "d1", user_id: "u1", rating: 5, would_repeat: false },
        { date_id: "d1", user_id: "u2", rating: 5, would_repeat: false },
      ],
    });
    expect(res.xp).toBe(170);
    expect(res.fiveStarCount).toBe(1);
    expect(
      res.milestones.find((m) => m.id === "five-star-hit")?.unlocked,
    ).toBe(true);
    expect(
      res.milestones.find((m) => m.id === "storytellers")?.unlocked,
    ).toBe(true);
  });

  it("also awards the +20 bonus when both reviews mark would_repeat", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
      dates: [{ id: "d1", idea_id: "i1", status: "done" }],
      reviews: [
        { date_id: "d1", user_id: "u1", rating: 4, would_repeat: true },
        { date_id: "d1", user_id: "u2", rating: 3, would_repeat: true },
      ],
    });
    expect(res.xp).toBe(170);
    expect(res.fiveStarCount).toBe(0);
    expect(
      res.milestones.find((m) => m.id === "five-star-hit")?.unlocked,
    ).toBe(false);
  });

  it("counts a done date with idea_id: null as one completed date", () => {
    const res = computeProgress({
      ...emptyInput,
      dates: [{ id: "d1", idea_id: null, status: "done" }],
    });
    expect(res.doneCount).toBe(1);
    expect(res.xp).toBe(100);
  });

  it("unlocks team-effort only when two distinct creators each have >= 3 ideas", () => {
    const oneShort = computeProgress({
      ...emptyInput,
      ideas: [
        { id: "1", status: "idea", created_by: "u1" },
        { id: "2", status: "idea", created_by: "u1" },
        { id: "3", status: "idea", created_by: "u1" },
        { id: "4", status: "idea", created_by: "u2" },
        { id: "5", status: "idea", created_by: "u2" },
      ],
    });
    expect(
      oneShort.milestones.find((m) => m.id === "team-effort")?.unlocked,
    ).toBe(false);

    const bothReady = computeProgress({
      ...emptyInput,
      ideas: [
        { id: "1", status: "idea", created_by: "u1" },
        { id: "2", status: "idea", created_by: "u1" },
        { id: "3", status: "idea", created_by: "u1" },
        { id: "4", status: "idea", created_by: "u2" },
        { id: "5", status: "idea", created_by: "u2" },
        { id: "6", status: "idea", created_by: "u2" },
      ],
    });
    expect(
      bothReady.milestones.find((m) => m.id === "team-effort")?.unlocked,
    ).toBe(true);
  });

  it("drops XP back to 0 when the only done idea is moved back to idea", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "idea", created_by: "u1" }],
    });
    expect(res.xp).toBe(0);
    expect(res.level).toBe(1);
    expect(res.doneCount).toBe(0);
  });
});
