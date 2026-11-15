"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/app/actions/dates";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-3">
      <input
        name="password"
        type="password"
        minLength={8}
        required
        autoComplete="new-password"
        placeholder="New password (min 8 characters)"
        className="min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
      />
      {state?.error && (
        <p role="status" className="text-sm text-stone-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {pending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
