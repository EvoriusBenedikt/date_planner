import "server-only";
import { extractPlace } from "./location";

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ city: string | null; area: string | null }> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("zoom", "14");
    url.searchParams.set("accept-language", "en");

    const res = await fetch(url, {
      headers: {
        "User-Agent": "date-planner/1.0",
      },
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return { city: null, area: null };
    const data = (await res.json()) as {
      address?: Record<string, string | undefined>;
    };
    if (!data.address) return { city: null, area: null };
    return extractPlace(data.address);
  } catch {
    return { city: null, area: null };
  }
}
