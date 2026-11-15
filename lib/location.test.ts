import { describe, expect, it } from "vitest";
import {
  countDistinctPlaces,
  extractPlace,
  haversineMeters,
  topCityPlaces,
} from "./location";

describe("haversineMeters", () => {
  it("returns 0 for identical coordinates and ~1.1km for 0.01 deg lat", () => {
    expect(
      haversineMeters({ lat: -6.2, lng: 106.8 }, { lat: -6.2, lng: 106.8 }),
    ).toBe(0);
    const dist = haversineMeters(
      { lat: -6.2, lng: 106.8 },
      { lat: -6.21, lng: 106.8 },
    );
    expect(dist).toBeGreaterThan(1000);
    expect(dist).toBeLessThan(1200);
  });
});

describe("countDistinctPlaces", () => {
  it("clusters photos within 200m into one place and counts farther spots separately", () => {
    const count = countDistinctPlaces([
      { lat: -6.2297, lng: 106.8095 },
      { lat: -6.2298, lng: 106.8096 }, // ~15m away -> same place
      { lat: -6.2615, lng: 106.8106 }, // ~3.5km away -> new place
      { lat: null, lng: null },
    ]);
    expect(count).toBe(2);
  });
});

describe("topCityPlaces", () => {
  it("returns the city with the most distinct places and total distinct cities", () => {
    const res = topCityPlaces([
      { lat: -6.2297, lng: 106.8095, city: "Jakarta" },
      { lat: -6.2615, lng: 106.8106, city: "jakarta" },
      { lat: -6.9175, lng: 107.6191, city: "Bandung" },
    ]);
    expect(res).toEqual({
      city: "Jakarta",
      places: 2,
      distinctCities: 2,
    });
  });
});

describe("extractPlace", () => {
  it("normalizes Jakarta sub-cities and Special Capital Region to Jakarta", () => {
    expect(
      extractPlace({
        city: "South Jakarta",
        suburb: "Senopati",
        state: "Special Capital Region of Jakarta",
      }),
    ).toEqual({ city: "Jakarta", area: "Senopati" });
  });

  it("extracts non-Jakarta cities cleanly", () => {
    expect(
      extractPlace({
        city: "Bandung",
        neighbourhood: "Dago",
      }),
    ).toEqual({ city: "Bandung", area: "Dago" });
  });
});
