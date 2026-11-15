import { CalendarCheck2, Camera, Sparkles, Star } from "lucide-react";
import type { Progress } from "@/lib/gamification";

export function LevelCard({ progress }: { progress: Progress }) {
  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Level {progress.level}
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">
              {progress.title}
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-stone-900">
            {progress.xp} XP
          </p>
          <p className="text-xs text-stone-500">
            {progress.xpIntoLevel} / {progress.xpForNextLevel} to Lv.{" "}
            {progress.level + 1}
          </p>
        </div>
      </div>

      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-100"
        role="progressbar"
        aria-valuenow={progress.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Level progress"
      >
        <div
          className="h-full rounded-full bg-rose-600 transition-all"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <CalendarCheck2 className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>Dates done</span>
          </div>
          <p className="mt-1 font-display text-xl font-semibold text-stone-900">
            {progress.doneCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Camera className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            <span>Photos</span>
          </div>
          <p className="mt-1 font-display text-xl font-semibold text-stone-900">
            {progress.photoCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span>5★ favorites</span>
          </div>
          <p className="mt-1 font-display text-xl font-semibold text-stone-900">
            {progress.fiveStarCount}
          </p>
        </div>
      </div>
    </section>
  );
}
