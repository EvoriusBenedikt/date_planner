import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Star } from "lucide-react";
import { getCtx } from "@/lib/auth";
import { ReviewForm } from "@/components/review-form";
import type { DateRow } from "@/lib/types";

type Review = {
  user_id: string;
  rating: number | null;
  note: string | null;
  would_repeat: boolean | null;
};

export default async function DatePage({ params }: PageProps<"/dates/[id]">) {
  const { id } = await params;
  const { supabase, user } = await getCtx();
  const { data } = await supabase
    .from("dates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const date = data as DateRow;
  const { data: rv } = await supabase
    .from("date_reviews")
    .select("*")
    .eq("date_id", id);
  const reviews = (rv ?? []) as Review[];
  const mine = reviews.find((r) => r.user_id === user.id);
  const partner = reviews.find((r) => r.user_id !== user.id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/dates"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          aria-label="Back to dates"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-stone-900">
            {date.title}
          </h1>
          <p className="text-xs capitalize text-stone-500">
            {date.scheduled_at &&
              new Date(date.scheduled_at).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
            · {date.status}
          </p>
        </div>
      </div>

      {date.notes && (
        <p className="rounded-2xl border border-stone-200/90 bg-white p-4 text-sm text-stone-700 shadow-xs">
          {date.notes}
        </p>
      )}

      {date.status === "planned" && (
        <a
          href={`/dates/${date.id}/ics`}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
        >
          <CalendarPlus className="h-4 w-4 text-rose-600" aria-hidden="true" />
          Add to calendar (.ics)
        </a>
      )}

      {date.status === "done" && (
        <>
          <ReviewForm dateId={id} initial={mine} />
          {/* hidden until you've reviewed, so neither answer is influenced by the other (UI only; RLS allows reading) */}
          {mine && partner && (
            <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-900">Partner&apos;s review</p>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: partner.rating ?? 0 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
              </div>
              {partner.note && <p className="text-sm text-stone-700">{partner.note}</p>}
              {partner.would_repeat && (
                <p className="text-xs font-medium text-rose-700">Would do again</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
