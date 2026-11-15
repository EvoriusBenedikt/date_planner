import { Award, Lock } from "lucide-react";
import type { Milestone } from "@/lib/gamification";

export function MilestonesGrid({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-stone-900">
        Milestones
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {milestones.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
              m.unlocked
                ? "border-rose-200 bg-rose-50/60"
                : "border-stone-200/80 bg-white opacity-80"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                m.unlocked
                  ? "bg-rose-600 text-white"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {m.unlocked ? (
                <Award className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-stone-900">{m.title}</h3>
                <span
                  className={`text-xs font-medium ${
                    m.unlocked ? "text-rose-700" : "text-stone-500"
                  }`}
                >
                  {m.unlocked ? "Unlocked" : `${m.current}/${m.target}`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-600">{m.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
