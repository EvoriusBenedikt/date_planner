/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Archive,
  Check,
  Clock,
  Heart,
  Home,
  RotateCcw,
  Sparkles,
  Trees,
} from "lucide-react";
import { setIdeaStatus, toggleLikeIdea } from "@/app/actions/ideas";
import { IdeaMemory } from "@/components/idea-memory";
import { thumbUrl, type Idea, type IdeaReview } from "@/lib/types";

function StatusButton({
  id,
  status,
  label,
  icon,
}: {
  id: string;
  status: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <form action={setIdeaStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50">
        {icon}
        {label}
      </button>
    </form>
  );
}

function getTikTokId(idea: Idea): string | null {
  if (idea.source_external_id) return idea.source_external_id;
  return idea.source_url?.match(/\/video\/(\d+)/)?.[1] ?? null;
}

export function IdeaCard({
  idea,
  authorName,
  liked,
  isMatch,
  reviews,
  currentUserId,
  profilesById,
}: {
  idea: Idea;
  authorName?: string;
  liked?: boolean;
  isMatch?: boolean;
  reviews?: IdeaReview[];
  currentUserId?: string;
  profilesById?: Record<string, string>;
}) {
  const img = thumbUrl(idea.thumbnail_path);
  const tags = idea.idea_tags?.map((t) => t.tags?.name).filter(Boolean) ?? [];
  const videoId = idea.source_type === "tiktok" ? getTikTokId(idea) : null;
  const showFooter =
    idea.status === "idea" || idea.status === "archived" || idea.status === "done";

  return (
    <article
      className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-200 hover:shadow-md ${
        isMatch
          ? "border-rose-300 ring-1 ring-rose-200/70 hover:border-rose-400"
          : "border-stone-200/90 hover:border-rose-200"
      }`}
    >
      <Link href={`/ideas/${idea.id}`} className="flex flex-1 gap-3.5 p-3.5">
        {img && !videoId && (
          <img
            src={img}
            alt=""
            className="h-24 w-20 shrink-0 rounded-xl bg-stone-100 object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold leading-snug text-stone-900">
                {idea.title}
              </h3>
              {isMatch && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Both want to do
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
              {authorName && (
                <span className="text-[11px] font-medium text-stone-500">
                  Added by {authorName}
                </span>
              )}
              {idea.budget && (
                <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium capitalize text-stone-700">
                  {idea.budget}
                </span>
              )}
              {idea.setting && idea.setting !== "either" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 capitalize text-stone-700">
                  {idea.setting === "indoor" ? (
                    <Home className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Trees className="h-3 w-3" aria-hidden="true" />
                  )}
                  {idea.setting}
                </span>
              )}
              {idea.duration_minutes && (
                <span className="inline-flex items-center gap-1 text-stone-500">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {idea.duration_minutes}m
                </span>
              )}
              {idea.category && (
                <span className="text-stone-500">{idea.category}</span>
              )}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {videoId && (
        <div className="border-t border-stone-100 bg-stone-950 p-2.5">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            loading="lazy"
            className="mx-auto aspect-[9/16] max-h-[540px] w-full max-w-[310px] rounded-xl border-0 bg-black"
            allow="autoplay; encrypted-media; fullscreen"
            title={idea.title}
          />
        </div>
      )}

      {idea.status === "done" && currentUserId && profilesById && (
        <IdeaMemory
          ideaId={idea.id}
          reviews={reviews ?? []}
          currentUserId={currentUserId}
          profilesById={profilesById}
        />
      )}

      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/60 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {idea.status === "idea" && (
              <>
                <StatusButton
                  id={idea.id}
                  status="done"
                  label="Done"
                  icon={
                    <Check
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                  }
                />
                <StatusButton
                  id={idea.id}
                  status="archived"
                  label="Archive"
                  icon={
                    <Archive
                      className="h-3.5 w-3.5 text-stone-500"
                      aria-hidden="true"
                    />
                  }
                />
              </>
            )}
            {idea.status === "archived" && (
              <StatusButton
                id={idea.id}
                status="idea"
                label="Unarchive"
                icon={
                  <RotateCcw
                    className="h-3.5 w-3.5 text-rose-600"
                    aria-hidden="true"
                  />
                }
              />
            )}
            {idea.status === "done" && (
              <StatusButton
                id={idea.id}
                status="idea"
                label="Move to ideas"
                icon={
                  <RotateCcw
                    className="h-3.5 w-3.5 text-stone-600"
                    aria-hidden="true"
                  />
                }
              />
            )}
          </div>

          {idea.status === "idea" && (
            <form action={toggleLikeIdea}>
              <input type="hidden" name="idea_id" value={idea.id} />
              <button
                aria-label={liked ? "Remove vote" : "I'm down"}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  liked
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-stone-200 bg-white text-stone-600 hover:border-rose-200 hover:text-rose-600"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                {liked ? "I'm down" : "Down?"}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
