"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { signIn } from "@/app/actions/auth";

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20";

function Form() {
  const [state, action, pending] = useActionState(signIn, null);
  const next = useSearchParams().get("next") ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-sm shadow-rose-600/20">
            <Heart className="h-6 w-6 fill-current" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">
            Date Planner
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Sign in to our private date space
          </p>
        </div>

        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {state?.error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.error}
            </p>
          )}

          <button
            disabled={pending}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
