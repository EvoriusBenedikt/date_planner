import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 2 * 1024 * 1024;

export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const l = ip.toLowerCase();
    if (l.startsWith("::ffff:")) return isPrivateIp(l.slice(7));
    return l === "::1" || l === "::" || /^f[cd]/.test(l) || l.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/** Download a remote image safely. Throws on anything suspicious. */
export async function downloadImage(
  rawUrl: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("Thumbnail must be https");
  const host = url.hostname;
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("Thumbnail host is private");
  }

  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Thumbnail fetch failed (${res.status})`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error("Not an image");
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new Error("Thumbnail too large");

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new Error("Thumbnail too large");
  return { bytes: buf, contentType };
}
