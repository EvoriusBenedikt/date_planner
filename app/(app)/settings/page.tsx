import { Bell, KeyRound, LogOut, User } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { updateSettings } from "@/app/actions/dates";
import { getCtx } from "@/lib/auth";
import { DisplayNameForm } from "@/components/display-name-form";
import { PasswordForm } from "@/components/password-form";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function Settings() {
  const { supabase, user, coupleId } = await getCtx();
  const [{ data: s }, { data: profile }] = await Promise.all([
    supabase
      .from("couple_settings")
      .select("*")
      .eq("couple_id", coupleId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-display text-2xl font-semibold text-stone-900">
        Settings
      </h1>

      <section className="space-y-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <User className="h-4 w-4 text-rose-600" aria-hidden="true" />
          Your name
        </h2>
        <DisplayNameForm initial={profile?.display_name ?? "Me"} />
      </section>

      <form
        action={updateSettings}
        className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5"
      >
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <Bell className="h-4 w-4 text-rose-600" aria-hidden="true" />
          Weekly nudge
        </h2>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
          <input
            type="checkbox"
            name="nudge_enabled"
            defaultChecked={s?.nudge_enabled ?? true}
            className="h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
          />
          Send a Telegram nudge when no date is planned
        </label>
        <div className="space-y-1">
          <label htmlFor="nudge_weekday" className="text-xs font-medium text-stone-600">
            Nudge day
          </label>
          <select
            id="nudge_weekday"
            name="nudge_weekday"
            defaultValue={s?.nudge_weekday ?? 1}
            className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-base text-stone-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button className="min-h-[42px] rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800">
          Save preferences
        </button>
      </form>

      <section className="space-y-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <KeyRound className="h-4 w-4 text-rose-600" aria-hidden="true" />
          Password
        </h2>
        <PasswordForm />
      </section>

      <form action={signOut} className="pt-1">
        <button className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 hover:text-stone-900 sm:w-auto">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );
}
