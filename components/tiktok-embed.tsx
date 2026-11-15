"use client";

import { useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";

// Loads TikTok's official embed only after a tap so the heavy player doesn't slow the page.
export function TikTokEmbed({ url, id }: { url: string; id: string }) {
  const [on, setOn] = useState(false);
  if (!on) {
    return (
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Watch on TikTok
        </a>
        <button
          type="button"
          onClick={() => setOn(true)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
        >
          <Play className="h-4 w-4 fill-current text-rose-600" aria-hidden="true" />
          Play here
        </button>
      </div>
    );
  }
  // v2 embed endpoint is an iframe, so no script injection is needed
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open on TikTok
        </a>
        <button
          type="button"
          onClick={() => setOn(false)}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Hide player
        </button>
      </div>
      <div className="flex justify-center">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${id}`}
          className="aspect-[9/16] max-h-[75vh] w-full max-w-[340px] rounded-xl border border-stone-200 bg-black"
          allow="autoplay; encrypted-media; fullscreen"
          title="TikTok video"
        />
      </div>
    </div>
  );
}
