/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";

export function PhotoCarousel({
  photos,
}: {
  photos: { url: string; caption: string }[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-stone-900">
          Photo Memories
        </h2>
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Camera className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 font-semibold text-stone-900">No photos yet</p>
          <p className="mt-1 max-w-xs text-sm text-stone-500">
            Add a photo on any Done date card and your memories will appear here.
          </p>
        </div>
      </section>
    );
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(photos.length - 1, next));
    setIndex(clamped);
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(index + 1);
    }
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== index && next >= 0 && next < photos.length) {
      setIndex(next);
    }
  }

  return (
    <section
      className="space-y-3"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Photo memories carousel"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight text-stone-900">
          Photo Memories
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500">
            {index + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-stone-200/90 bg-stone-950 shadow-xs"
      >
        {photos.map((photo, idx) => (
          <figure
            key={`${photo.url}-${idx}`}
            className="relative w-full shrink-0 snap-start"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              loading="lazy"
              className="aspect-[4/3] w-full object-contain sm:aspect-[16/10]"
            />
            <figcaption className="bg-stone-900/90 px-4 py-2.5 text-sm font-medium text-white">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
