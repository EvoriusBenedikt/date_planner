/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { deleteIdea, updateIdea } from "@/app/actions/ideas";
import { getCtx, thumbUrl } from "@/lib/auth";
import { IdeaForm } from "@/components/idea-form";
import { TikTokEmbed } from "@/components/tiktok-embed";
import type { Idea } from "@/lib/types";

export default async function IdeaPage({ params }: PageProps<"/ideas/[id]">) {
  const { id } = await params;
  const { supabase } = await getCtx();
  const { data } = await supabase
    .from("ideas")
    .select("*, idea_tags(tags(name))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const idea = data as Idea;
  const img = thumbUrl(idea.thumbnail_path);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          aria-label="Back to ideas"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <h1 className="truncate font-display text-2xl font-semibold text-stone-900">
          {idea.title}
        </h1>
      </div>

      {(img || idea.source_url || idea.source_caption) && (
        <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-5">
          {img && (
            <img
              src={img}
              alt=""
              className="max-h-72 w-full rounded-xl bg-stone-100 object-cover"
            />
          )}
          {idea.source_url &&
          idea.source_type === "tiktok" &&
          idea.source_external_id ? (
            <TikTokEmbed url={idea.source_url} id={idea.source_external_id} />
          ) : (
            idea.source_url && (
              <a
                href={idea.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100"
              >
                <ExternalLink className="h-4 w-4 text-rose-600" aria-hidden="true" />
                Open source link
              </a>
            )
          )}
          {idea.source_caption && (
            <p className="text-sm leading-relaxed text-stone-600">
              {idea.source_author && (
                <span className="font-semibold text-stone-900">
                  @{idea.source_author}:{" "}
                </span>
              )}
              {idea.source_caption}
            </p>
          )}
        </div>
      )}

      <IdeaForm action={updateIdea.bind(null, idea.id)} idea={idea} />

      <div className="flex justify-end pt-2">
        <form action={deleteIdea}>
          <input type="hidden" name="id" value={idea.id} />
          <button className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete idea
          </button>
        </form>
      </div>
    </div>
  );
}
