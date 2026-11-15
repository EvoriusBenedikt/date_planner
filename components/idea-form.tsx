/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronDown, Link2, Loader2 } from "lucide-react";
import type { FormState } from "@/app/actions/ideas";
import { BUDGETS, SETTINGS, type Idea } from "@/lib/types";

type Source = {
  url: string;
  type: string;
  externalId: string;
  author: string;
  caption: string;
  thumbnailPath: string;
};
const empty: Source = {
  url: "",
  type: "none",
  externalId: "",
  author: "",
  caption: "",
  thumbnailPath: "",
};

const inputCls =
  "min-h-[44px] w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 sm:text-sm";

function previewThumb(path: string) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
}

export function IdeaForm({
  action,
  idea,
  initialLink,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  idea?: Idea;
  initialLink?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [title, setTitle] = useState(idea?.title ?? "");
  const [link, setLink] = useState(initialLink ?? "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [src, setSrc] = useState<Source>(
    idea
      ? {
          url: idea.source_url ?? "",
          type: idea.source_type,
          externalId: idea.source_external_id ?? "",
          author: idea.source_author ?? "",
          caption: idea.source_caption ?? "",
          thumbnailPath: idea.thumbnail_path ?? "",
        }
      : empty,
  );
  const tags =
    idea?.idea_tags?.map((t) => t.tags?.name).filter(Boolean).join(", ") ?? "";
  const ran = useRef(false);

  async function resolve(text: string) {
    if (!/https?:\/\//i.test(text)) return;
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/resolve-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      if (j.ok) {
        setSrc({
          url: j.sourceUrl,
          type: "tiktok",
          externalId: j.externalId,
          author: j.author,
          caption: j.caption,
          thumbnailPath: j.thumbnailPath ?? "",
        });
        setTitle((t) => t || j.title);
      } else {
        if (j.sourceUrl) setSrc({ ...empty, url: j.sourceUrl, type: "other" });
        setNote("Couldn't read that link. Type a title and save anyway.");
      }
    } catch {
      setNote("Couldn't reach the server. Type a title and save anyway.");
    }
    setBusy(false);
  }

  useEffect(() => {
    if (initialLink && !ran.current) {
      ran.current = true;
      resolve(initialLink);
    }
  }, [initialLink]);

  const thumb = !idea ? previewThumb(src.thumbnailPath) : null;

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs sm:p-6"
    >
      {!idea && (
        <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5">
          <label
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700"
            htmlFor="link"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Paste a TikTok link
          </label>
          <div className="flex gap-2">
            <input
              id="link"
              className={inputCls}
              value={link}
              placeholder="https://vm.tiktok.com/…"
              onChange={(e) => setLink(e.target.value)}
              onPaste={(e) => resolve(e.clipboardData.getData("text"))}
            />
            <button
              type="button"
              onClick={() => resolve(link)}
              disabled={busy}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "Fetch"
              )}
            </button>
          </div>
          {note && <p className="text-xs font-medium text-amber-800">{note}</p>}
        </div>
      )}

      {thumb && (
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
          <img
            src={thumb}
            alt=""
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 text-xs text-stone-600">
            {src.author && <p className="font-semibold text-stone-900">@{src.author}</p>}
            {src.caption && <p className="line-clamp-2">{src.caption}</p>}
          </div>
        </div>
      )}

      {src.url && !thumb && (
        <p className="truncate rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
          Source: {src.url}
        </p>
      )}

      <input type="hidden" name="source_url" value={src.url} />
      <input type="hidden" name="source_type" value={src.type} />
      <input type="hidden" name="source_external_id" value={src.externalId} />
      <input type="hidden" name="source_author" value={src.author} />
      <input type="hidden" name="source_caption" value={src.caption} />
      <input type="hidden" name="thumbnail_path" value={src.thumbnailPath} />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-stone-800" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="e.g. Sunset picnic at the park"
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <details open={!!idea} className="group rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5">
        <summary className="flex list-none items-center justify-between text-sm font-medium text-stone-700">
          <span>More details (optional)</span>
          <ChevronDown
            className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              placeholder="food, outdoor…"
              defaultValue={idea?.category ?? ""}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600" htmlFor="duration_minutes">
              Duration (minutes)
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={1}
              placeholder="90"
              defaultValue={idea?.duration_minutes ?? ""}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600" htmlFor="budget">
              Budget
            </label>
            <select
              id="budget"
              name="budget"
              defaultValue={idea?.budget ?? ""}
              className={inputCls}
            >
              <option value="">Any budget</option>
              {BUDGETS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600" htmlFor="setting">
              Setting
            </label>
            <select
              id="setting"
              name="setting"
              defaultValue={idea?.setting ?? "either"}
              className={inputCls}
            >
              {SETTINGS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-stone-600" htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              placeholder="coffee, weekend, cozy (comma separated)"
              defaultValue={tags}
              className={inputCls}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-stone-600" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any extra details…"
              defaultValue={idea?.notes ?? ""}
              rows={3}
              className={inputCls}
            />
          </div>
        </div>
      </details>

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
        {pending ? "Saving…" : idea ? "Save changes" : "Save idea"}
      </button>
    </form>
  );
}
