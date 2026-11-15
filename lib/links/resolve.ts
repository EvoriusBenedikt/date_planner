import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadImage } from "@/lib/links/ssrf";
import {
  canonicalUrl,
  extractUrl,
  fetchOEmbed,
  parseTikTokId,
  resolveFinalUrl,
} from "@/lib/links/tiktok";

export type ResolveResult =
  | {
      ok: true;
      sourceUrl: string;
      externalId: string;
      title: string;
      author: string;
      caption: string;
      thumbnailPath: string | null;
    }
  | {
      ok: false;
      sourceUrl?: string;
      error: string;
    };

export async function resolveTikTokInput(
  text: string,
  supabase: SupabaseClient,
  userId: string,
): Promise<ResolveResult> {
  const found = extractUrl(text);
  if (!found) return { ok: false, error: "No link found" };

  try {
    const final = await resolveFinalUrl(found);
    const externalId = parseTikTokId(final);
    if (!externalId) throw new Error("Not a video link");
    const canonical = canonicalUrl(final, externalId);
    const oembed = await fetchOEmbed(canonical);

    let thumbnailPath: string | null = null;
    const { data: member } = await supabase
      .from("couple_members")
      .select("couple_id")
      .eq("user_id", userId)
      .maybeSingle();
    const img =
      member && oembed.thumbnail_url
        ? await downloadImage(oembed.thumbnail_url).catch(() => null)
        : null;
    if (member && img) {
      const path = `${member.couple_id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage
        .from("thumbnails")
        .upload(path, img.bytes, { contentType: img.contentType });
      if (!error) thumbnailPath = path;
    }

    return {
      ok: true,
      sourceUrl: canonical,
      externalId,
      title: oembed.title?.slice(0, 200) ?? "",
      author: oembed.author_name ?? "",
      caption: oembed.title ?? "",
      thumbnailPath,
    };
  } catch (e) {
    return {
      ok: false,
      sourceUrl: found,
      error: e instanceof Error ? e.message : "Failed",
    };
  }
}
