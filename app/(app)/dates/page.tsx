import Link from "next/link";
import { CalendarHeart, CalendarPlus, Check, History, X } from "lucide-react";
import { setDateStatus } from "@/app/actions/dates";
import { getCtx } from "@/lib/auth";
import type { DateRow } from "@/lib/types";

function Row({ d, actions }: { d: DateRow; actions?: boolean }) {
  const btn = (status: string, label: string, icon: React.ReactNode) => (
    <form action={setDateStatus}>
      <input type="hidden" name="id" value={d.id} />
      <input type="hidden" name="status" value={status} />
      <button className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50">
        {icon}
        {label}
      </button>
    </form>
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-xs transition-colors hover:border-rose-200">
      <Link href={`/dates/${d.id}`} className="block p-4">
        <p className="font-semibold text-stone-900">{d.title}</p>
        {d.scheduled_at && (
          <p className="mt-1 text-xs text-stone-500">
            {new Date(d.scheduled_at).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </Link>
      {actions && (
        <div className="flex flex-wrap gap-2 border-t border-stone-100 bg-stone-50/60 px-4 py-2.5">
          {btn("done", "Mark done", <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />)}
          {btn("cancelled", "Cancel", <X className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />)}
          <a
            href={`/dates/${d.id}/ics`}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
            Add to calendar
          </a>
        </div>
      )}
    </div>
  );
}

export default async function Dates() {
  const { supabase } = await getCtx();
  const { data: datesData } = await supabase
    .from("dates")
    .select("*")
    .order("scheduled_at", { ascending: false });
  const all = (datesData ?? []) as DateRow[];
  const planned = all.filter((d) => d.status === "planned").reverse();
  const history = all.filter((d) => d.status === "done");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-stone-900">
          <CalendarHeart className="h-5 w-5 text-rose-600" aria-hidden="true" />
          Upcoming
        </h1>
        {planned.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-sm text-stone-500">
            Nothing planned yet.{" "}
            <Link href="/pick" className="font-medium text-rose-600 underline">
              Pick one for us
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {planned.map((d) => (
              <Row key={d.id} d={d} actions />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-stone-900">
          <History className="h-5 w-5 text-stone-500" aria-hidden="true" />
          History
        </h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-center text-sm text-stone-500">
            No dates done yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {history.map((d) => (
              <Row key={d.id} d={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
