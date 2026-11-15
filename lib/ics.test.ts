import { expect, it } from "vitest";
import { buildIcs } from "./ics";

it("builds an event with escaped text", () => {
  const out = buildIcs({ id: "1", title: "Cafe, hop", start: new Date("2030-01-02T03:04:05Z") });
  expect(out).toContain("DTSTART:20300102T030405Z");
  expect(out).toContain("DTEND:20300102T050405Z");
  expect(out).toContain("SUMMARY:Cafe\\, hop");
});
