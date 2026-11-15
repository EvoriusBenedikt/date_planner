"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquarePlus, Star } from "lucide-react";
import { saveIdeaMemory } from "@/app/actions/ideas";
import type { IdeaReview } from "@/lib/types";

export function IdeaMemory({
  ideaId,
  reviews,
  currentUserId,
  profilesById,
}: {
  ideaId: string;
  reviews: IdeaReview[];
  currentUserId: string;
  profilesById: Record<string, string>;
}) {
  const mine = reviews.find((r) => r.user_id === currentUserId);
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(saveIdeaMemory, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state?.error]);

  return (
    <div className="space-y-2.5 border-t border-stone-100 bg-stone-50/40 px-3.5 py-3">
      {reviews.length > 0 && (
        <div className="space-y-1.5">
          {reviews.map((r) => (
            <div key={r.user_id} className="text-xs text-stone-700">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-900">
                  {profilesById[r.user_id] ?? "Partner"}
                </span>
                <span className="inline-flex items-center text-amber-500">
                  {Array.from({ length: r.rating ?? 0 }).map((_, idx) => (
                    <Star key={idx} className="h-3 w-3 fill-current" aria-hidden="true" />
                  ))}
                </span>
                {r.would_repeat && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    Would repeat
                  </span>
                )}
              </div>
              {r.note && <p className="mt-0.5 text-stone-600">{r.note}</p>}
            </div>
          ))}
        </div>
      )}

      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
          {mine ? "Edit my memory" : "Add memory"}
        </button>
      ) : (
        <form
          action={action}
          className="space-y-2 rounded-xl border border-stone-200 bg-white p-3"
        >
          <input type="hidden" name="idea_id" value={ideaId} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              name="rating"
              required
              defaultValue={mine?.rating ?? "5"}
              className="min-h-[38px] rounded-lg border border-stone-200 bg-white px-2.5 text-sm text-stone-900"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} / 5 stars
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                name="would_repeat"
                defaultChecked={mine?.would_repeat ?? true}
                className="h-4 w-4 rounded border-stone-300 text-rose-600"
              />
              Would do again
            </label>
          </div>
          <input
            name="note"
            defaultValue={mine?.note ?? ""}
            placeholder="One-line memory…"
            maxLength={200}
            className="min-h-[38px] w-full rounded-lg border border-stone-200 bg-white px-2.5 text-sm text-stone-900 placeholder:text-stone-400"
          />
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-[34px] rounded-lg px-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              disabled={pending}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-stone-900 px-3 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
