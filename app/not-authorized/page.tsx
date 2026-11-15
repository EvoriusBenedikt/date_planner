import { ShieldAlert } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default function NotAuthorized() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-semibold text-stone-900">
          Not authorized
        </h1>
        <p className="text-sm text-stone-600">
          This account isn&apos;t part of the couple.
        </p>
        <form action={signOut}>
          <button className="min-h-[44px] w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
