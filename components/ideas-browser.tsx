"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Lightbulb, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { IdeaCard } from "@/components/idea-card";
import { QuickAdd } from "@/components/quick-add";
import {
  BUDGETS,
  SETTINGS,
  type Idea,
  type IdeaPhoto,
  type IdeaReview,
} from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "idea", label: "Ideas" },
  { value: "matches", label: "Matches" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

const fieldCls =
  "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm";

export function IdeasBrowser({
  ideas,
  profilesById,
  likedIds,
  matchIds,
  reviewsByIdeaId,
  photosByIdeaId = {},
  currentUserId,
}: {
  ideas: Idea[];
  profilesById: Record<string, string>;
  likedIds: string[];
  matchIds: string[];
  reviewsByIdeaId: Record<string, IdeaReview[]>;
  photosByIdeaId?: Record<string, IdeaPhoto[]>;
  currentUserId: string;
}) {
  const [status, setStatus] = useState<string>("idea");
  const [q, setQ] = useState("");
  const [budget, setBudget] = useState("");
  const [setting, setSetting] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);
  const matchSet = useMemo(() => new Set(matchIds), [matchIds]);
  const activeCount = [budget, setting, category, tag].filter(Boolean).length;

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      idea: 0,
      matches: matchIds.length,
      done: 0,
      archived: 0,
      all: ideas.length,
    };
    for (const i of ideas) {
      map[i.status] = (map[i.status] ?? 0) + 1;
    }
    return map;
  }, [ideas, matchIds.length]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const catl = category.trim().toLowerCase();
    const tagl = tag.trim().toLowerCase();

    return ideas
      .filter((i) => {
        if (status === "matches") {
          if (!matchSet.has(i.id)) return false;
        } else if (status !== "all" && i.status !== status) {
          return false;
        }
        if (budget && i.budget !== budget) return false;
        if (setting && i.setting !== setting) return false;
        if (catl && (i.category ?? "").toLowerCase() !== catl) return false;
        if (
          tagl &&
          !i.idea_tags?.some((t) => t.tags?.name?.toLowerCase() === tagl)
        ) {
          return false;
        }
        if (ql) {
          const hay =
            `${i.title} ${i.notes ?? ""} ${i.source_caption ?? ""}`.toLowerCase();
          if (!hay.includes(ql)) return false;
        }
        return true;
      })
      .sort((a, b) => Number(matchSet.has(b.id)) - Number(matchSet.has(a.id)));
  }, [ideas, status, q, budget, setting, category, tag, matchSet]);

  function clearAll() {
    setQ("");
    setBudget("");
    setSetting("");
    setCategory("");
    setTag("");
  }

  return (
    <div className="space-y-5">
      <QuickAdd />

      <div className="space-y-3">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {STATUS_OPTIONS.map((opt) => {
            const active = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-stone-900 text-white shadow-xs"
                    : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                {opt.value === "matches" && (
                  <Heart
                    className={`h-3.5 w-3.5 ${
                      active ? "fill-rose-400 text-rose-400" : "fill-rose-500 text-rose-500"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span>{opt.label}</span>
                <span
                  className={`text-xs ${
                    active ? "text-stone-300" : "text-stone-400"
                  }`}
                >
                  {counts[opt.value] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ideas, notes, captions…"
              className={`${fieldCls} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
              filtersOpen || activeCount > 0
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-stone-200 bg-white p-3 shadow-xs sm:grid-cols-4">
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={fieldCls}
            >
              <option value="">Any budget</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className={fieldCls}
            >
              <option value="">Any setting</option>
              {SETTINGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className={fieldCls}
            />
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag"
              className={fieldCls}
            />
            {(activeCount > 0 || q) && (
              <div className="col-span-2 flex justify-end pt-1 sm:col-span-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <section>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Lightbulb className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-3 font-semibold text-stone-900">
              {status === "matches" ? "No matches yet" : "Nothing here yet"}
            </p>
            <p className="mt-1 max-w-xs text-sm text-stone-500">
              {status === "matches"
                ? "Tap \"I'm down\" on ideas you want to do—when you both heart one, it shows up here."
                : activeCount > 0 || q
                  ? "Try clearing your search or filters."
                  : "Paste a TikTok link above or jot down a quick date idea."}
            </p>
            {activeCount > 0 || q ? (
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
              >
                Clear filters
              </button>
            ) : (
              status !== "matches" && (
                <Link
                  href="/ideas/new"
                  className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add an idea
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filtered.map((i) => (
              <IdeaCard
                key={i.id}
                idea={i}
                authorName={profilesById[i.created_by]}
                liked={likedSet.has(i.id)}
                isMatch={matchSet.has(i.id)}
                reviews={reviewsByIdeaId[i.id]}
                photos={photosByIdeaId[i.id]}
                currentUserId={currentUserId}
                profilesById={profilesById}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
