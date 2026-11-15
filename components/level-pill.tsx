import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Progress } from "@/lib/gamification";
import { getProgress } from "@/lib/progress";

export async function LevelPill() {
  let progress: Progress | null = null;
  try {
    progress = await getProgress();
  } catch {
    return null;
  }

  if (!progress) return null;

  return (
    <Link
      href="/memories"
      className="inline-flex min-h-[36px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-rose-200/80 bg-rose-50/70 px-3 py-1 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Lv. {progress.level}</span>
      <span className="hidden text-rose-600/90 lg:inline">
        {progress.title}
      </span>
      <span
        className="h-1 w-10 overflow-hidden rounded-full bg-rose-200/80"
        aria-hidden="true"
      >
        <span
          className="block h-full rounded-full bg-rose-600 transition-all"
          style={{ width: `${progress.pct}%` }}
        />
      </span>
    </Link>
  );
}
