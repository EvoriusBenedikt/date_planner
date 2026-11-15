# Couple Levels, Milestones & Memories Design

**Date:** 2026-11-15  
**Status:** Proposed (awaiting approval)

## 1. Intent & Why

The goal of the app is to make going on dates easier by capturing ideas and motivating the two of you to actually go on them. Adding **Levels & Milestones** rewards completing dates without punishing busy weeks (no streaks), while **Photo Memories & "Do it again"** turns the **Done** tab and a new **Memories** page into a shared scrapbook that sparks the urge to repeat your best dates.

## 2. Goals & Non-Goals

**Goals**
- Show your **Couple Level** in the top header so it is visible everywhere and links to `/memories`.
- Let either partner upload resized date photos and view them **inside Done cards** as well as in a **photo carousel on `/memories`**.
- Add a 1-tap **"Do it again"** action on Done cards (and a *"Repeat a favorite"* option in `/pick`) to bring great past dates back into the active pool.
- Compute **Level, XP, and Milestones** deterministically from existing database tables with **zero new SQL migrations**.

**Non-Goals**
- Punishing time-based streaks or weekly quotas.
- Custom user-authored milestones or public sharing of photos/stats.

## 3. Approaches Considered

| Approach | Summary | Trade-off |
|---|---|---|
| **A. Derived from existing data (Chosen)** | Compute XP, Level, and Milestones in pure TypeScript from `ideas`, `dates`, `date_reviews`, `date_photos`, and `swipes`. | Zero DB migrations; new badges unlock retroactively. Does not store a separate "unlocked on" timestamp per badge. |
| **B. Stored achievements table** | Add a `couple_milestones` table via a new SQL migration and sync it on every status/review change. | Preserves exact unlock timestamps, but requires manual SQL migration and extra sync/rollback logic. |

## 4. Progression System (XP, Levels & Milestones)

Implemented as a pure, unit-tested module (`lib/gamification.ts`).

### XP Sources
- **+100 XP** per completed date (`ideas.status === 'done'` or `dates.status === 'done'`).
- **+25 XP** per partner review submitted (`date_reviews` row).
- **+25 XP** per photo memory uploaded (`date_photos` row, capped at +50 XP per date so bulk uploads don't skew levels).
- **+20 XP** bonus when both partners rated a date `5★` or marked `would_repeat = true`.

### Level Curve
Simple progressive thresholds (e.g., `0, 100, 250, 450, 700, 1000, ...` — `100 * level * (level - 1) / 2` or similar smooth curve) with friendly couple titles (*Spark*, *Explorer*, *Adventurer*, *Regulars*, *Soulmates*, etc.).

### Initial Milestones (8 badges)
1. **First Date** — Complete 1 date
2. **Getting Started** — Complete 5 dates
3. **Double Digits** — Complete 10 dates
4. **Quarter Century** — Complete 25 dates
5. **Picture Perfect** — Upload your first date photo
6. **Storytellers** — Both partners leave a memory/review on the same date
7. **Five-Star Hit** — Both partners rate a date `5★`
8. **Both Down** — Complete an idea that you both hearted (`swipes` match)

## 5. Photo Memories & Storage

- Reuses the existing private `date-photos` bucket and `public.date_photos` table from `0001_init.sql`.
- **Client-side resize:** Before upload, resize images in the browser (`<canvas>`) to max `1280px` on the longest side, JPEG at `0.8` quality (~150–300 KB) to keep Supabase Free's 1 GB storage lasting for years.
- **Server action (`uploadDatePhoto`):** Ensures a `dates` row exists for the `idea_id` (same pattern as `saveIdeaMemory`), uploads to `{couple_id}/{date_id}/{uuid}.jpg`, and inserts into `date_photos`.
- **Signed URLs:** Server components generate short-lived signed URLs (`createSignedUrls`) so private couple photos never become public.

## 6. UI & Navigation Changes

1. **Global Header ([components/app-nav.tsx](file:///C:/Users/ben/Documents/Programming/Personal%20Project/date_planner/components/app-nav.tsx), [app/(app)/layout.tsx](file:///C:/Users/ben/Documents/Programming/Personal%20Project/date_planner/app/(app)/layout.tsx)):**
   - `AppLayout` computes the lightweight `level` summary once per request and passes it to `TopNav`.
   - `TopNav` displays a compact `Lv. N` pill with progress bar linking to `/memories` on both mobile and desktop.
   - Add **Memories** to both `TopNav` and `BottomNav` (`Ideas`, `Pick`, `+ Add`, `Memories`, `Settings`).
2. **Done Cards ([components/idea-card.tsx](file:///C:/Users/ben/Documents/Programming/Personal%20Project/date_planner/components/idea-card.tsx), [components/idea-memory.tsx](file:///C:/Users/ben/Documents/Programming/Personal%20Project/date_planner/components/idea-memory.tsx)):**
   - Display photo thumbnails inside Done cards with an **Add photo** button (resizes client-side and uploads).
   - Add a **"Do it again"** button (`repeatIdea` action: resets status to `'idea'` or clones a fresh `'idea'` keeping past memories intact — **Call:** clone a new `'idea'` row when memories/photos exist so past memories stay preserved in Done, or move back to `'idea'` if no memories exist).
3. **Memories Page (`app/(app)/memories/page.tsx`):**
   - **Level & XP Banner:** Current level, title, XP progress bar to next level, and quick stats (Dates Done, Photos, 5★ Favorites).
   - **Photo Carousel (`components/photo-carousel.tsx`):** Swipeable / arrow-controlled carousel of all date photos with date title caption.
   - **Milestones Grid:** Shows unlocked badges (highlighted) and locked badges (with progress hint).
4. **Pick Page ([app/(app)/pick/page.tsx](file:///C:/Users/ben/Documents/Programming/Personal%20Project/date_planner/app/(app)/pick/page.tsx)):**
   - Add a **"Repeat a favorite"** toggle that picks randomly from `done` ideas marked `would_repeat = true`.
