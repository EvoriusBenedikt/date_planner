"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { prepareDatePhoto, recordDatePhoto } from "@/app/actions/memories";
import {
  extractPhotoMetadata,
  resizeToJpeg,
  validatePhotoFile,
} from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

export function PhotoUploader({ ideaId }: { ideaId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    const validationError = validatePhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      const prepared = await prepareDatePhoto(ideaId);
      if ("error" in prepared) {
        setError(prepared.error);
        return;
      }

      const metadata = await extractPhotoMetadata(file);
      const blob = await resizeToJpeg(file);
      const storagePath = `${prepared.coupleId}/${prepared.dateId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("date-photos")
        .upload(storagePath, blob, { contentType: "image/jpeg" });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const recorded = await recordDatePhoto(
        prepared.dateId,
        storagePath,
        metadata,
      );
      if (recorded.error) {
        setError(recorded.error);
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={pending}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" aria-hidden="true" />
        ) : (
          <Camera className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
        )}
        {pending ? "Uploading…" : "Add photo"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
