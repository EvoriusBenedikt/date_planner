"use client";

import { useActionState } from "react";
import { Loader2, Star } from "lucide-react";
import { upsertReview } from "@/app/actions/dates";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm";

export function ReviewForm({
  dateId,
  initial,
}: {
  dateId: string;
  initial?: {
    rating: number | null;
    note: string | null;
    would_repeat: boolean | null;
  };
}) {
  const [state, action, pending] = useActionState(upsertReview, null);
  return (
    <form
      action={action}
      className="space-y-3.5 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5"
    >
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
        <Star className="h-5 w-5 text-amber-500" aria-hidden="true" />
        How was it?
      </h2>
      <input type="hidden" name="date_id" value={dateId} />
      <select
        name="rating"
        required
        defaultValue={initial?.rating ?? ""}
        className={inputCls}
      >
        <option value="" disabled>
          Rating
        </option>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} / 5 stars
          </option>
        ))}
      </select>
      <textarea
        name="note"
        rows={3}
        defaultValue={initial?.note ?? ""}
        placeholder="A short note about the date…"
        className={inputCls}
      />
      <label className="flex min-h-[36px] cursor-pointer items-center gap-2.5 text-sm text-stone-700">
        <input
          type="checkbox"
          name="would_repeat"
          defaultChecked={initial?.would_repeat ?? false}
          className="h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
        />
        Would do again
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {pending ? "Saving…" : "Save review"}
      </button>
    </form>
  );
}
