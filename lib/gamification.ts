export type ProgressInput = {
  ideas: {
    id: string;
    status: "idea" | "planned" | "done" | "archived";
    created_by: string;
  }[];
  dates: {
    id: string;
    idea_id: string | null;
    status: "planned" | "done" | "cancelled";
  }[];
  reviews: {
    date_id: string;
    user_id: string;
    rating: number | null;
    would_repeat: boolean | null;
  }[];
  photos: { date_id: string }[];
};

export type Milestone = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  current: number;
  target: number;
};

export type Progress = {
  xp: number;
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  pct: number;
  doneCount: number;
  photoCount: number;
  fiveStarCount: number;
  milestones: Milestone[];
};

const LEVEL_TITLES = [
  "Spark",
  "Explorers",
  "Adventurers",
  "Regulars",
  "Partners in Crime",
  "Soulmates",
] as const;

export function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (levelThreshold(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

function titleForLevel(level: number): string {
  return LEVEL_TITLES[level - 1] ?? "Legends";
}

export function computeProgress(input: ProgressInput): Progress {
  const doneIdeasCount = input.ideas.filter((i) => i.status === "done").length;
  const standaloneDoneDatesCount = input.dates.filter(
    (d) => d.status === "done" && d.idea_id === null,
  ).length;
  const doneCount = doneIdeasCount + standaloneDoneDatesCount;

  const photosByDate = new Map<string, number>();
  for (const photo of input.photos) {
    photosByDate.set(photo.date_id, (photosByDate.get(photo.date_id) ?? 0) + 1);
  }
  let creditedPhotos = 0;
  for (const count of photosByDate.values()) {
    creditedPhotos += Math.min(2, count);
  }

  const reviewsByDate = new Map<string, ProgressInput["reviews"]>();
  for (const review of input.reviews) {
    const list = reviewsByDate.get(review.date_id);
    if (list) list.push(review);
    else reviewsByDate.set(review.date_id, [review]);
  }

  let bonusDates = 0;
  let storytellerDates = 0;
  let fiveStarCount = 0;

  for (const dateReviews of reviewsByDate.values()) {
    const distinctUsers = new Set(dateReviews.map((r) => r.user_id));
    if (distinctUsers.size >= 2) {
      storytellerDates += 1;
    }

    const fiveStarUsers = new Set(
      dateReviews.filter((r) => r.rating === 5).map((r) => r.user_id),
    );
    if (fiveStarUsers.size >= 2) {
      fiveStarCount += 1;
    }

    if (dateReviews.length >= 2) {
      const allFive = dateReviews.every((r) => r.rating === 5);
      const allRepeat = dateReviews.every((r) => r.would_repeat === true);
      if (allFive || allRepeat) {
        bonusDates += 1;
      }
    }
  }

  const ideasByCreator = new Map<string, number>();
  for (const idea of input.ideas) {
    ideasByCreator.set(
      idea.created_by,
      (ideasByCreator.get(idea.created_by) ?? 0) + 1,
    );
  }
  let contributorsWithThree = 0;
  for (const count of ideasByCreator.values()) {
    if (count >= 3) contributorsWithThree += 1;
  }

  const xp =
    doneCount * 100 +
    input.reviews.length * 25 +
    creditedPhotos * 25 +
    bonusDates * 20;

  const level = levelFromXp(xp);
  const currentThreshold = levelThreshold(level);
  const nextThreshold = levelThreshold(level + 1);
  const xpIntoLevel = xp - currentThreshold;
  const xpForNextLevel = Math.max(1, nextThreshold - currentThreshold);
  const pct = Math.floor((xpIntoLevel / xpForNextLevel) * 100);
  const photoCount = input.photos.length;

  const milestones: Milestone[] = [
    {
      id: "first-date",
      title: "First Date",
      description: "Complete your first date together",
      unlocked: doneCount >= 1,
      current: Math.min(doneCount, 1),
      target: 1,
    },
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Complete 5 dates together",
      unlocked: doneCount >= 5,
      current: Math.min(doneCount, 5),
      target: 5,
    },
    {
      id: "double-digits",
      title: "Double Digits",
      description: "Complete 10 dates together",
      unlocked: doneCount >= 10,
      current: Math.min(doneCount, 10),
      target: 10,
    },
    {
      id: "quarter-century",
      title: "Quarter Century",
      description: "Complete 25 dates together",
      unlocked: doneCount >= 25,
      current: Math.min(doneCount, 25),
      target: 25,
    },
    {
      id: "picture-perfect",
      title: "Picture Perfect",
      description: "Save your first date photo",
      unlocked: photoCount >= 1,
      current: Math.min(photoCount, 1),
      target: 1,
    },
    {
      id: "storytellers",
      title: "Storytellers",
      description: "Both leave a review on the same date",
      unlocked: storytellerDates >= 1,
      current: Math.min(storytellerDates, 1),
      target: 1,
    },
    {
      id: "five-star-hit",
      title: "Five-Star Hit",
      description: "Both rate the same date 5 stars",
      unlocked: fiveStarCount >= 1,
      current: Math.min(fiveStarCount, 1),
      target: 1,
    },
    {
      id: "team-effort",
      title: "Team Effort",
      description: "Each of you saves at least 3 ideas",
      unlocked: contributorsWithThree >= 2,
      current: Math.min(contributorsWithThree, 2),
      target: 2,
    },
  ];

  return {
    xp,
    level,
    title: titleForLevel(level),
    xpIntoLevel,
    xpForNextLevel,
    pct,
    doneCount,
    photoCount,
    fiveStarCount,
    milestones,
  };
}
