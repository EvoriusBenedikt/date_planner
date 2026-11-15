import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createIdea } from "@/app/actions/ideas";
import { IdeaForm } from "@/components/idea-form";

export default async function NewIdea({ searchParams }: PageProps<"/ideas/new">) {
  const sp = await searchParams;
  const link = Array.isArray(sp.link) ? sp.link[0] : sp.link;
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          aria-label="Back to ideas"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-stone-900">
          New idea
        </h1>
      </div>
      <IdeaForm action={createIdea} initialLink={link} />
    </div>
  );
}
