"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ClipboardPaste, Loader2, Plus } from "lucide-react";
import { quickCreateIdea } from "@/app/actions/ideas";

export function QuickAdd() {
  const [state, action, pending] = useActionState(quickCreateIdea, null);
  const [text, setText] = useState("");
  const [clipErr, setClipErr] = useState("");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setText("");
    }
    wasPending.current = pending;
  }, [pending, state?.error]);

  async function pasteFromClipboard() {
    setClipErr("");
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip.trim());
    } catch {
      setClipErr("Clipboard access blocked — paste into the box directly.");
    }
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-rose-200/80 bg-white p-2.5 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <input
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a TikTok link or type an idea…"
          required
          maxLength={400}
          className="min-h-[42px] min-w-0 flex-1 bg-transparent px-2 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none sm:text-sm"
        />
        <button
          type="button"
          onClick={pasteFromClipboard}
          aria-label="Paste from clipboard"
          title="Paste from clipboard"
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100"
        >
          <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Paste</span>
        </button>
        <button
          disabled={pending || !text.trim()}
          className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {pending ? "Saving…" : "Add"}
        </button>
      </div>
      {(state?.error || clipErr) && (
        <p role="alert" className="mt-1.5 px-2 text-xs text-red-600">
          {state?.error || clipErr}
        </p>
      )}
    </form>
  );
}
