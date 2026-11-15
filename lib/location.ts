export type GeoPhoto = {
  lat: number | null;
  lng: number | null;
  city: string | null;
};

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function countDistinctPlaces(
  photos: { lat: number | null; lng: number | null }[],
  thresholdMeters = 200,
): number {
  const clusters: { lat: number; lng: number }[] = [];
  for (const p of photos) {
    if (p.lat === null || p.lng === null) continue;
    const point = { lat: p.lat, lng: p.lng };
    const matchesExisting = clusters.some(
      (c) => haversineMeters(c, point) < thresholdMeters,
    );
    if (!matchesExisting) {
      clusters.push(point);
    }
  }
  return clusters.length;
}

export function topCityPlaces(
  photos: GeoPhoto[],
  thresholdMeters = 200,
): { city: string | null; places: number; distinctCities: number } {
  const byCity = new Map<string, { label: string; photos: GeoPhoto[] }>();

  for (const p of photos) {
    const raw = p.city?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const entry = byCity.get(key);
    if (entry) {
      entry.photos.push(p);
    } else {
      byCity.set(key, { label: raw, photos: [p] });
    }
  }

  let bestCity: string | null = null;
  let bestPlaces = 0;

  for (const { label, photos: cityPhotos } of byCity.values()) {
    const places = countDistinctPlaces(cityPhotos, thresholdMeters);
    if (places > bestPlaces) {
      bestPlaces = places;
      bestCity = label;
    }
  }

  return {
    city: bestCity,
    places: bestPlaces,
    distinctCities: byCity.size,
  };
}

export function extractPlace(address: Record<string, string | undefined>): {
  city: string | null;
  area: string | null;
} {
  const rawCity =
    address.city ||
    address.town ||
    address.municipality ||
    address.state_district ||
    address.state ||
    null;

  let city = rawCity?.trim() || null;
  if (
    city &&
    (/jakarta/i.test(city) ||
      /jakarta/i.test(address.state ?? ""))
  ) {
    city = "Jakarta";
  }

  const area =
    (
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.city_district ||
      ""
    ).trim() || null;

  return { city, area };
}
