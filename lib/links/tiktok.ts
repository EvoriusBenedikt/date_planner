export const ALLOWED_HOSTS = new Set([
  "www.tiktok.com", "tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
]);
const MAX_HOPS = 5;
const TIMEOUT_MS = 5000;

export function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

type Fetcher = (url: URL) => Promise<{ location: string | null }>;

const defaultFetcher: Fetcher = async (url) => {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { location: res.headers.get("location") };
};

export async function resolveFinalUrl(input: string, fetcher: Fetcher = defaultFetcher): Promise<URL> {
  let url = new URL(input);
  for (let i = 0; i < MAX_HOPS; i++) {
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      throw new Error("Unsupported link host");
    }
    if (!/^(vm|vt)\./.test(url.hostname) && !url.pathname.startsWith("/t/")) return url;
    const { location } = await fetcher(url);
    if (!location) throw new Error("Could not resolve short link");
    url = new URL(location, url);
  }
  throw new Error("Too many redirects");
}

export function parseTikTokId(u: URL): string | null {
  return u.pathname.match(/\/video\/(\d+)/)?.[1] ?? null;
}

export function canonicalUrl(u: URL, id: string): string {
  const user = u.pathname.match(/^\/(@[^/]+)\//)?.[1];
  return user ? `https://www.tiktok.com/${user}/video/${id}` : u.origin + u.pathname;
}

export async function fetchOEmbed(canonical: string) {
  const res = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(canonical)}`,
    { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`oEmbed failed (${res.status})`);
  return (await res.json()) as {
    title: string; author_name: string; author_url: string; thumbnail_url: string;
  };
}

// shortcut: blocks IP literals and localhost only, no DNS check; tighten to a CDN suffix allowlist once real hostnames are known.
export function isSafeImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "localhost" || u.hostname.includes(":") || /^[\d.]+$/.test(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function downloadImage(raw: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  if (!isSafeImageUrl(raw)) return null;
  const res = await fetch(raw, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error" });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) return null;
  const bytes = await res.arrayBuffer();
  return bytes.byteLength > MAX_IMAGE_BYTES ? null : { bytes, type };
}
