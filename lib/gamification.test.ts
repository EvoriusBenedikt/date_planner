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
  it("handles an empty couple with zero XP, level 1, 0%, and all achievements locked", () => {
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
    expect(res.achievements.every((a) => a.unlocked === false)).toBe(true);
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

  it("caps photo XP at 2 photos per date (3 photos on one date add 50 XP) and unlocks first-snapshot", () => {
    const res = computeProgress({
      ...emptyInput,
      ideas: [{ id: "i1", status: "done", created_by: "u1" }],
      dates: [{ id: "d1", idea_id: "i1", status: "done" }],
      photos: [{ date_id: "d1" }, { date_id: "d1" }, { date_id: "d1" }],
    });
    expect(res.xp).toBe(150);
    expect(res.photoCount).toBe(3);
    expect(
      res.achievements.find((a) => a.id === "first-snapshot")?.unlocked,
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
      res.achievements.find((a) => a.id === "five-star-hit")?.unlocked,
    ).toBe(true);
    expect(
      res.achievements.find((a) => a.id === "storytellers")?.unlocked,
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
      res.achievements.find((a) => a.id === "five-star-hit")?.unlocked,
    ).toBe(false);
  });

  it("tracks city place counts, out-of-town, night-owls, and golden-hour from photo metadata", () => {
    const res = computeProgress({
      ...emptyInput,
      photos: [
        { date_id: "d1", lat: -6.2, lng: 106.8, city: "Jakarta", taken_hour: 22 },
        { date_id: "d2", lat: -6.23, lng: 106.81, city: "Jakarta", taken_hour: 17 },
        { date_id: "d3", lat: -6.26, lng: 106.82, city: "Jakarta", taken_hour: 12 },
        { date_id: "d4", lat: -6.91, lng: 107.61, city: "Bandung", taken_hour: 14 },
      ],
    });

    const regulars = res.achievements.find((a) => a.id === "local-regulars");
    expect(regulars?.unlocked).toBe(true);
    expect(regulars?.description).toContain("Jakarta");

    const explorers = res.achievements.find((a) => a.id === "city-explorers");
    expect(explorers?.unlocked).toBe(false);
    expect(explorers?.current).toBe(3);

    expect(res.achievements.find((a) => a.id === "out-of-town")?.unlocked).toBe(
      true,
    );
    expect(res.achievements.find((a) => a.id === "night-owls")?.unlocked).toBe(
      true,
    );
    expect(res.achievements.find((a) => a.id === "golden-hour")?.unlocked).toBe(
      true,
    );
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
