# Levels, Milestones & Photo Memories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a derived couple Level/XP/Milestones system (visible in the global header), photo memories inside Done cards, a `/memories` page with a photo carousel, "Do it again", and "Repeat a favorite" in `/pick`.

**Architecture:** All progression is computed in a pure TypeScript module (`lib/gamification.ts`) from existing tables (`ideas`, `dates`, `date_reviews`, `date_photos`). Photos are resized in the browser and uploaded **directly to the private `date-photos` bucket** from the browser Supabase client (avoids Server Action body limits), then recorded by a server action. No new SQL migrations.

**Tech Stack:** Next.js 16 App Router (Cache Components on), React 19, Supabase (`@supabase/ssr`), Tailwind 4, lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-levels-memories-design.md`

## Global Constraints

- **No new SQL migrations.** Only tables/policies already in `supabase/migrations/0001_init.sql`.
- **Free tier:** photos resized to max **1280 px** longest side, JPEG quality **0.8**, before upload. Original file rejected if not `image/*` or larger than **15 MB**.
- **Private photos only:** show photos via `createSignedUrls` (expiry **3600 s**); never make the bucket public.
- **Storage path:** `{couple_id}/{date_id}/{uuid}.jpg` (the RLS policy checks the first segment).
- **XP values (exact):** +100 per completed date; +25 per review; +25 per photo, counted for at most **2 photos per date**; +20 bonus per date with ≥2 reviews where all reviews rated 5 **or** all marked `would_repeat`.
- **Level curve (exact):** threshold for level `L` = `50 * L * (L - 1)` XP (L1=0, L2=100, L3=300, L4=600, L5=1000, L6=1500 …). Titles: 1 Spark, 2 Explorers, 3 Adventurers, 4 Regulars, 5 Partners in Crime, 6 Soulmates, 7+ Legends.
- **Cache Components:** any component reading cookies/session must sit under `<Suspense>`. Before writing code that touches Server Actions, `loading.tsx`, or Suspense, skim the matching guide in `node_modules/next/dist/docs/` (per `AGENTS.md`).
- **UI conventions:** match the existing look (stone/rose palette, `font-display` headings, `min-h-[44px]` touch targets, lucide icons, 16px inputs on mobile).
- **Verification gate for every task:** `npx tsc --noEmit`, `npx vitest run`, `npm run lint` (run Node commands outside the sandbox with `C:\Users\ben\AppData\Local\nvm\v24.14.0` on `PATH`).

## Deviations from the spec (decided while planning)

1. **"Both Down" milestone replaced by "Team Effort".** `swipes` rows are private under RLS and `get_matches` only returns ideas still in `status = 'idea'`, so a completed idea's mutual-heart status cannot be computed without a new migration. *Team Effort* ("each of you has saved at least 3 ideas") is computable from `ideas.created_by`.
2. **Cloning a TikTok idea** for "Do it again" must null `source_external_id`, because `ideas_unique_source` (`couple_id, source_type, source_external_id`) would reject a duplicate. The embed still works: `idea-card.tsx` falls back to parsing `/video/{id}` from `source_url`.
3. **Existing bug fixed in passing:** `app/(app)/page.tsx` overwrites `reviewsByIdeaId[idea_id]` when an idea has more than one `dates` row; it must concatenate. `saveIdeaMemory` also picks the *newest* `dates` row; it will pick the *oldest* so both partners converge on one row.

## Review Focus

1. **Brand-new couple (zero rows):** level 1, 0 % progress, no `NaN`/divide-by-zero, all milestones locked.
2. **TikTok idea cloned by "Do it again":** insert succeeds despite the unique source index; original Done idea keeps its memories and XP.
3. **Two partners create the `dates` row at once / duplicate rows per idea:** reviews and photos from all rows are merged, none overwritten.
4. **Bad uploads:** non-image, >15 MB, or an undecodable image (e.g. HEIC in Chrome) shows an inline error and writes nothing to `date_photos`.
5. **Idea moved Done → Ideas:** XP/level may drop; every page still renders, and a Done idea with no `dates` row still counts as a completed date.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/gamification.ts` (new) | Pure: `computeProgress(input)` → XP, level, title, percent, stats, milestones |
| `lib/gamification.test.ts` (new) | Unit tests for the above |
| `lib/memory-data.ts` (new) | Pure: `groupByIdea` merge helper; `buildRepeatRow` clone builder |
| `lib/memory-data.test.ts` (new) | Unit tests for the above |
| `lib/image.ts` (new) | Pure `fitWithin`, `validatePhotoFile`; browser `resizeToJpeg` |
| `lib/image.test.ts` (new) | Unit tests for the pure helpers |
| `lib/progress.ts` (new, server) | `getProgress()` – cached per request; fetches rows, calls `computeProgress` |
| `lib/memories.ts` (new, server) | `ensureDoneDate`, `signPhotoUrls` |
| `app/actions/memories.ts` (new) | `prepareDatePhoto`, `recordDatePhoto`, `repeatIdea` |
| `components/photo-uploader.tsx` (new) | Client: pick → resize → upload → record |
| `components/photo-carousel.tsx` (new) | Client: scroll-snap carousel with arrows |
| `components/level-pill.tsx` (new, server) | Header `Lv. N` pill + progress bar, links to `/memories` |
| `components/level-card.tsx`, `components/milestones-grid.tsx` (new) | Memories page sections |
| `app/(app)/memories/page.tsx` (new) | Memories page |
| `lib/types.ts`, `app/(app)/layout.tsx`, `components/app-nav.tsx`, `components/idea-card.tsx`, `components/idea-memory.tsx`, `components/ideas-browser.tsx`, `app/(app)/page.tsx`, `app/actions/ideas.ts`, `app/(app)/pick/page.tsx` (modify) | Wire everything in |

---

### Task 1: Gamification core (pure)

**Files:**
- Create: `lib/gamification.ts`
- Test: `lib/gamification.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ProgressInput = {
    ideas: { id: string; status: "idea" | "planned" | "done" | "archived"; created_by: string }[];
    dates: { id: string; idea_id: string | null; status: "planned" | "done" | "cancelled" }[];
    reviews: { date_id: string; user_id: string; rating: number | null; would_repeat: boolean | null }[];
    photos: { date_id: string }[];
  };
  export type Milestone = { id: string; title: string; description: string; unlocked: boolean; current: number; target: number };
  export type Progress = {
    xp: number; level: number; title: string;
    xpIntoLevel: number; xpForNextLevel: number; pct: number; // pct is 0-100 integer
    doneCount: number; photoCount: number; fiveStarCount: number;
    milestones: Milestone[];
  };
  export function levelThreshold(level: number): number;   // 50 * L * (L - 1)
  export function levelFromXp(xp: number): number;         // largest L with threshold <= xp
  export function computeProgress(input: ProgressInput): Progress;
  ```
- Milestone ids/targets (exact): `first-date` (done ≥ 1), `getting-started` (≥ 5), `double-digits` (≥ 10), `quarter-century` (≥ 25), `picture-perfect` (photos ≥ 1), `storytellers` (some date has reviews from ≥ 2 distinct users), `five-star-hit` (some date has ≥ 2 distinct users who each rated 5), `team-effort` (≥ 2 distinct `created_by` each with ≥ 3 ideas). `doneCount` = ideas with `status === "done"` + dates with `status === "done"` and `idea_id === null`. `fiveStarCount` = number of dates meeting the five-star-hit condition.

- [ ] **Step 1: Write failing tests** in `lib/gamification.test.ts`: `levelThreshold` returns 0/100/300/600 for levels 1–4; `levelFromXp(99)=1`, `(100)=2`, `(299)=2`, `(300)=3`; empty input → `{xp:0, level:1, pct:0, doneCount:0}` with every milestone `unlocked:false` and no `NaN`; 1 done idea → xp 100; 1 done idea + 2 reviews → xp 150; 3 photos on one date add only 50 XP; two 5★ reviews from different users on one date add the +20 bonus and unlock `five-star-hit` and `storytellers`; a `would_repeat` pair also earns the +20 bonus; a done date with `idea_id: null` counts as one completed date; `team-effort` unlocks only when two creators each have ≥ 3 ideas; moving the only done idea back to `idea` returns xp to 0.
- [ ] **Step 2: Run** `npx vitest run lib/gamification.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `lib/gamification.ts` per the signatures and constants above (no I/O, no React). `pct = Math.floor(xpIntoLevel / xpForNextLevel * 100)` where `xpForNextLevel = levelThreshold(level+1) - levelThreshold(level)`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `git add lib/gamification.ts lib/gamification.test.ts && git commit -m "feat: add pure progression engine"`

---

### Task 2: Pure helpers — image sizing, grouping, repeat-row builder

**Files:**
- Create: `lib/image.ts`, `lib/memory-data.ts`
- Test: `lib/image.test.ts`, `lib/memory-data.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/image.ts
  export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
  export const MAX_EDGE = 1280;
  export function fitWithin(w: number, h: number, max?: number): { width: number; height: number }; // never upscales, keeps aspect, integers
  export function validatePhotoFile(f: { type: string; size: number }): string | null; // error message or null
  export function resizeToJpeg(file: File): Promise<Blob>; // browser only: createImageBitmap + canvas, quality 0.8; throws Error("Couldn't read that image") on decode failure

  // lib/memory-data.ts
  export function groupByIdea<T>(rows: { idea_id: string | null; children: T[] | null }[]): Record<string, T[]>; // concatenates across rows with the same idea_id; skips null idea_id
  export function buildRepeatRow(idea: Idea, ctx: { coupleId: string; userId: string }): Record<string, unknown>; // copy of title, notes, category, budget, setting, duration_minutes, source_url, source_type, source_author, source_caption, thumbnail_path; status "idea"; couple_id/created_by from ctx; source_external_id intentionally omitted
  ```

- [ ] **Step 1: Write failing tests:** `fitWithin(4000,3000)` → `{1280,960}`; `fitWithin(800,600)` unchanged; `fitWithin(3000,4000)` → `{960,1280}`; `validatePhotoFile` rejects `application/pdf` and a 16 MB `image/jpeg`, accepts a 1 MB `image/png`; `groupByIdea` merges two rows for the same idea into one array of both children and ignores `idea_id: null` and `children: null`; `buildRepeatRow` result has `status: "idea"`, the supplied `couple_id`/`created_by`, `thumbnail_path` preserved, and **no** `source_external_id` key.
- [ ] **Step 2: Run** `npx vitest run lib/image.test.ts lib/memory-data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** both files (`resizeToJpeg` is not unit-tested; it is exercised in Task 4's manual check).
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `git add lib && git commit -m "feat: add image sizing, grouping and repeat-row helpers"`

---

### Task 3: Server data layer + existing-bug fixes

**Files:**
- Create: `lib/progress.ts`, `lib/memories.ts`
- Modify: `app/actions/ideas.ts` (`saveIdeaMemory`), `app/(app)/page.tsx`, `lib/types.ts`

**Interfaces:**
- Consumes: `computeProgress`, `ProgressInput`, `Progress` (Task 1); `groupByIdea` (Task 2); `getCtx` from `lib/auth.ts`.
- Produces:
  ```ts
  // lib/progress.ts  ("server-only")
  export const getProgress: () => Promise<Progress>; // React cache(); 4 parallel selects: ideas(id,status,created_by), dates(id,idea_id,status), date_reviews(date_id,user_id,rating,would_repeat), date_photos(date_id)
  // lib/memories.ts  ("server-only")
  export function ensureDoneDate(ctx: Ctx, ideaId: string): Promise<string>; // returns the OLDEST dates row for the idea (order created_at asc); creates one {status:"done", title: idea title} if none
  export function signPhotoUrls(supabase: SupabaseClient, paths: string[]): Promise<Record<string, string>>; // path -> signed URL; on error returns {} (callers render no photo)
  // lib/types.ts
  export type IdeaPhoto = { id: string; storage_path: string; url: string };
  ```
- [ ] **Step 1:** Implement `lib/memories.ts` and `lib/progress.ts` per the signatures.
- [ ] **Step 2:** Refactor `saveIdeaMemory` in `app/actions/ideas.ts` to call `ensureDoneDate` instead of its inline lookup/insert (oldest row wins).
- [ ] **Step 3:** In `app/(app)/page.tsx`, extend the dates query to `select("idea_id, date_reviews(user_id, rating, note, would_repeat), date_photos(id, storage_path)")`, build `reviewsByIdeaId` and `photosByIdeaId` via `groupByIdea` (fixes the overwrite bug), sign all photo paths in one `signPhotoUrls` call, and pass `photosByIdeaId: Record<string, IdeaPhoto[]>` to `IdeasBrowser` (prop threading to `IdeaCard` happens in Task 4).
- [ ] **Step 4: Verify:** `npx tsc --noEmit` (no errors), `npx vitest run` (all pass), `npm run lint`. Manual: run the app; Done cards still show both partners' reviews.
- [ ] **Step 5: Commit** `git commit -am "feat: add progress and memory data layer"` (include new files)

---

### Task 4: Photo upload + photos inside Done cards

**Files:**
- Create: `app/actions/memories.ts`, `components/photo-uploader.tsx`
- Modify: `components/idea-memory.tsx`, `components/idea-card.tsx`, `components/ideas-browser.tsx`

**Interfaces:**
- Consumes: `ensureDoneDate` (Task 3), `resizeToJpeg`/`validatePhotoFile` (Task 2), `createClient` from `lib/supabase/client.ts`, `IdeaPhoto`.
- Produces:
  ```ts
  // app/actions/memories.ts ("use server")
  export async function prepareDatePhoto(ideaId: string): Promise<{ coupleId: string; dateId: string } | { error: string }>;
  export async function recordDatePhoto(dateId: string, storagePath: string): Promise<{ error?: string }>; // rejects unless storagePath starts with `${coupleId}/${dateId}/`; inserts date_photos {date_id, couple_id, uploaded_by, storage_path}; revalidatePath("/", "layout")
  // components/photo-uploader.tsx
  export function PhotoUploader(props: { ideaId: string }): JSX.Element; // "Add photo" button; flow: validatePhotoFile -> prepareDatePhoto -> resizeToJpeg -> browser upload to `date-photos` at `${coupleId}/${dateId}/${crypto.randomUUID()}.jpg` -> recordDatePhoto; shows pending state and inline error; writes nothing on any failure
  ```
- [ ] **Step 1:** Implement `app/actions/memories.ts` (validate ids with zod uuid; every action starts with `getCtx()`).
- [ ] **Step 2:** Implement `PhotoUploader` (hidden `<input type="file" accept="image/*">`, 44px button, Review Focus #4 errors rendered under the button).
- [ ] **Step 3:** Add a photo thumbnail strip (signed URLs, `loading="lazy"`, 64 px squares) and `<PhotoUploader />` to `IdeaMemory`; thread `photos` through `IdeaCard` and `IdeasBrowser`.
- [ ] **Step 4: Verify:** `tsc`, `vitest`, `lint` pass. Manual: in a Done card upload a phone photo → it appears after refresh; upload a `.pdf` renamed `.jpg` and a >15 MB image → inline error and no new `date_photos` row (check Supabase Table Editor).
- [ ] **Step 5: Commit** `git commit -am "feat: photo memories on done cards"` (include new files)

---

### Task 5: "Do it again"

**Files:**
- Modify: `app/actions/memories.ts`, `components/idea-card.tsx`

**Interfaces:**
- Consumes: `buildRepeatRow` (Task 2).
- Produces: `export async function repeatIdea(fd: FormData): Promise<void>` — reads `idea_id`; loads the idea (with its tag names); inserts `buildRepeatRow(...)`; copies tags to the new idea via `idea_tags`; `revalidatePath("/", "layout")`. The original idea stays `done`.
- [ ] **Step 1:** Implement `repeatIdea` (uses `getCtx`; copies tags by selecting the source `idea_tags` rows and inserting them for the new idea id).
- [ ] **Step 2:** In `IdeaCard`'s Done footer add a **Do it again** button (`RotateCcw`/`Repeat` icon) posting to `repeatIdea`, next to the existing **Move to ideas**.
- [ ] **Step 3: Verify:** `tsc`, `lint`. Manual: click **Do it again** on a TikTok Done card → a new card appears under **Ideas** (same title/thumbnail/video), the original stays in **Done** with its photos and reviews, and no "already saved" error appears (Review Focus #2).
- [ ] **Step 4: Commit** `git commit -am "feat: do it again clones a done idea"`

---

### Task 6: Global level pill + navigation

**Files:**
- Create: `components/level-pill.tsx`
- Modify: `app/(app)/layout.tsx`, `components/app-nav.tsx`

**Interfaces:**
- Consumes: `getProgress` (Task 3).
- Produces: `export async function LevelPill(): Promise<JSX.Element>` — server component; renders a link to `/memories` with `Lv. {level}`, the title (hidden below `sm`), and a 4 px progress bar at `pct`. `TopNav` gains an optional prop `levelSlot?: React.ReactNode`.
- [ ] **Step 1:** Implement `LevelPill` (reads `getProgress()`; on any thrown error render nothing so the header never breaks).
- [ ] **Step 2:** In `layout.tsx` render `<TopNav levelSlot={<Suspense fallback={null}><LevelPill /></Suspense>} />` (the Suspense boundary is required by Cache Components and keeps navigation non-blocking).
- [ ] **Step 3:** In `app-nav.tsx`: show `levelSlot` beside the logo on desktop and in place of the mobile "New" button (the bottom-nav **+** already covers adding); add **Memories** (`Images` icon, `/memories`) to `navItems` between Pick and Settings; change the bottom nav grid to `grid-cols-5` so it reads Ideas · Pick · **+** · Memories · Settings (split the nav items around the centre button accordingly).
- [ ] **Step 4: Verify:** `tsc`, `lint`, `npm run build`. Manual at 375 px and 1024 px: pill visible on every page, bottom nav has no overlap, active state highlights Memories.
- [ ] **Step 5: Commit** `git commit -am "feat: global level pill and memories nav"`

---

### Task 7: Memories page

**Files:**
- Create: `app/(app)/memories/page.tsx`, `components/level-card.tsx`, `components/milestones-grid.tsx`, `components/photo-carousel.tsx`

**Interfaces:**
- Consumes: `getProgress` (Task 3), `signPhotoUrls`, `Progress`/`Milestone` (Task 1).
- Produces:
  ```ts
  export function LevelCard(props: { progress: Progress }): JSX.Element;            // level, title, XP bar, 3 stats (Dates done, Photos, 5★ favorites)
  export function MilestonesGrid(props: { milestones: Milestone[] }): JSX.Element;  // unlocked = rose highlight; locked = muted with `current/target`
  export function PhotoCarousel(props: { photos: { url: string; caption: string }[] }): JSX.Element; // "use client"; CSS scroll-snap, prev/next buttons, ArrowLeft/ArrowRight keys, `aria-label` on controls; empty state
  ```
- [ ] **Step 1:** Implement the three components following the existing card styling.
- [ ] **Step 2:** Implement the page: fetch `getProgress()` and all `date_photos` joined to `dates(title, scheduled_at, created_at)`, newest first; sign URLs; render `LevelCard`, `PhotoCarousel` (caption = date title), `MilestonesGrid`. Page body that reads the session goes under `<Suspense>`, with the shared `loading.tsx` skeleton as fallback.
- [ ] **Step 3: Verify:** `tsc`, `lint`, `build`. Manual: a couple with no data sees Level 1, an empty-carousel message and 8 locked milestones (Review Focus #1); after uploading a photo, `picture-perfect` unlocks and the photo appears in the carousel.
- [ ] **Step 4: Commit** `git add . && git commit -m "feat: memories page with level, carousel and milestones"`

---

### Task 8: "Repeat a favorite" in Pick

**Files:**
- Modify: `app/(app)/pick/page.tsx`

**Interfaces:**
- Consumes: `repeatIdea` (Task 5).
- Behavior: a **Repeat a favorite** checkbox (`name="favorite"`, preserved by Reroll via the query string). When checked, ignore the other filters, load `done` ideas whose `dates → date_reviews` include a row with `would_repeat = true`, choose one at random on the server, and show it with a **Do it again** button (posts to `repeatIdea`) instead of **View idea**. Empty result → "No favorites yet — mark a Done date 'Would do again'."
- [ ] **Step 1:** Add the checkbox and the TypeScript selection branch (no SQL; reuse the existing `go` UUID re-roll mechanism).
- [ ] **Step 2: Verify:** `tsc`, `lint`. Manual: with one Done idea marked "Would do again", `/pick?favorite=on` shows it; **Do it again** adds it to **Ideas**; with none, the empty message appears.
- [ ] **Step 3: Commit** `git commit -am "feat: repeat a favorite in pick"`

---

### Task 9: Final verification and push

- [ ] **Step 1:** Run `npx tsc --noEmit`, `npx vitest run`, `npm run lint`, `npm run build`. Expected: all pass, `/memories` appears in the route list.
- [ ] **Step 2:** Full manual pass at 375 px and desktop: add idea → Done → add memory + photo → level/XP updates in the header → carousel shows photo → **Do it again** → **Repeat a favorite** in Pick.
- [ ] **Step 3:** `git status` (confirm `.env.local` is not staged), then `git push origin main`. Vercel redeploys automatically; no new environment variables are needed.

---

## Self-Review

- **Spec coverage:** Level visible everywhere → Task 6; Done-card photos → Task 4; Memories page + carousel + milestones → Task 7; Do it again → Task 5; Repeat a favorite → Task 8; derived XP/levels/milestones → Task 1; resize/free-tier → Tasks 2 & 4; signed URLs → Tasks 3, 4 & 7. The only spec change is the swapped milestone (documented above).
- **Types:** `ProgressInput`/`Progress`/`Milestone` are defined in Task 1 and used unchanged in Tasks 3, 6 and 7; `IdeaPhoto` is defined in Task 3 and used in Task 4; `buildRepeatRow` (Task 2) feeds `repeatIdea` (Task 5), which Task 8 reuses.
- **Review Focus coverage:** #1 → Task 1 empty-input test + Task 7 manual; #2 → Tasks 2 (no `source_external_id` test) and 5; #3 → Tasks 2 (`groupByIdea` test) and 3; #4 → Tasks 2 (`validatePhotoFile` tests) and 4; #5 → Task 1 (done → idea test).
