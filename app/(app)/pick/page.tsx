import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { getCtx } from "@/lib/auth";
import { BUDGETS, SETTINGS, type Idea } from "@/lib/types";

const fieldCls =
  "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm";

export default async function Pick({ searchParams }: PageProps<"/pick">) {
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";
  const { supabase, coupleId } = await getCtx();
  const searched = get("go") !== "";

  const minutes = Number(get("minutes"));
  const { data } = searched
    ? await supabase.rpc("pick_idea", {
        p_couple: coupleId,
        p_budget: get("budget") || null,
        p_setting: get("setting") || null,
        p_max_minutes: minutes > 0 ? minutes : null,
        p_category: get("category") || null,
      })
    : { data: null };
  const idea = (data as Idea[] | null)?.[0];
  // a changing `go` value makes Reroll a fresh request
  const go = crypto.randomUUID();
  const qs = new URLSearchParams({
    go: String(go),
    budget: get("budget"),
    setting: get("setting"),
    minutes: get("minutes"),
    category: get("category"),
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900">
          Pick for us
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Filter what you&apos;re in the mood for and let fate decide.
        </p>
      </div>

      <form className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5">
        <input type="hidden" name="go" value={go} />
        <select name="budget" defaultValue={get("budget")} className={fieldCls}>
          <option value="">Any budget</option>
          {BUDGETS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select name="setting" defaultValue={get("setting")} className={fieldCls}>
          <option value="">Indoor or outdoor</option>
          {SETTINGS.filter((s) => s !== "either").map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          name="minutes"
          type="number"
          min={1}
          defaultValue={get("minutes")}
          placeholder="Max minutes"
          className={fieldCls}
        />
        <input
          name="category"
          defaultValue={get("category")}
          placeholder="Category"
          className={fieldCls}
        />
        <button className="col-span-2 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-700">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Pick an idea
        </button>
      </form>

      {searched && !idea && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No ideas match those filters. Loosen one or{" "}
          <Link href="/ideas/new" className="font-semibold underline">
            add more ideas
          </Link>
          .
        </div>
      )}

      {idea && (
        <div className="space-y-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Picked for you
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-stone-900">
              {idea.title}
            </h2>
            <p className="mt-1 text-sm capitalize text-stone-500">
              {[idea.budget, idea.setting, idea.category].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              href={`/ideas/${idea.id}`}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
            >
              View idea
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={`/pick?${qs}`}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reroll
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
