import { Suspense } from "react";
import { getCtx } from "@/lib/auth";
import { signPhotoUrls } from "@/lib/memories";
import { getProgress } from "@/lib/progress";
import { LevelCard } from "@/components/level-card";
import { MilestonesGrid } from "@/components/milestones-grid";
import { PhotoCarousel } from "@/components/photo-carousel";

async function MemoriesContent() {
  const { supabase } = await getCtx();

  const [progress, { data: photoRows }] = await Promise.all([
    getProgress(),
    supabase
      .from("date_photos")
      .select(
        "id, storage_path, created_at, city, area, dates(title, scheduled_at, created_at)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const rows = (photoRows ?? []) as unknown as {
    id: string;
    storage_path: string;
    created_at: string;
    city: string | null;
    area: string | null;
    dates: { title: string | null } | { title: string | null }[] | null;
  }[];

  const signedMap = await signPhotoUrls(
    supabase,
    rows.map((r) => r.storage_path),
  );

  const photos = rows
    .map((r) => {
      const url = signedMap[r.storage_path];
      if (!url) return null;
      const dateObj = Array.isArray(r.dates) ? r.dates[0] : r.dates;
      const title = dateObj?.title || "Date memory";
      const place = [r.area, r.city].filter(Boolean).join(", ");
      return {
        url,
        caption: place ? `${title} · ${place}` : title,
      };
    })
    .filter((x): x is { url: string; caption: string } => x !== null);

  return (
    <div className="space-y-6">
      <LevelCard progress={progress} />
      <PhotoCarousel photos={photos} />
      <MilestonesGrid milestones={progress.achievements} />
    </div>
  );
}

function MemoriesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 rounded-2xl border border-stone-200 bg-white" />
      <div className="h-64 rounded-2xl border border-stone-200 bg-white" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-2xl border border-stone-200 bg-white" />
        <div className="h-20 rounded-2xl border border-stone-200 bg-white" />
      </div>
    </div>
  );
}

export default function MemoriesPage() {
  return (
    <Suspense fallback={<MemoriesSkeleton />}>
      <MemoriesContent />
    </Suspense>
  );
}
