const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export function buildIcs(e: { id: string; title: string; start: Date; notes?: string | null; minutes?: number }) {
  const end = new Date(e.start.getTime() + (e.minutes ?? 120) * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//date-planner//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@date-planner`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.notes ? [`DESCRIPTION:${esc(e.notes)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
