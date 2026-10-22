import { describe, it, expect } from "vitest";
import {
  activityTimes,
  buildTripCalendar,
  calendarFileName,
  escapeText,
  foldLine,
} from "./calendar.js";

const trip = {
  id: "trip1",
  title: "Cox's Bazar, beach week",
  description: "Sun; sea\nand sand",
  startDate: new Date("2030-01-10T00:00:00Z"),
  endDate: new Date("2030-01-15T00:00:00Z"),
};

const activities = [
  {
    id: "a1",
    title: "Sunset at Inani",
    description: "Bring a camera",
    date: new Date("2030-01-11T00:00:00Z"),
    time: "17:30",
    location: {
      name: "Inani Beach",
      address: "Marine Drive, Cox's Bazar",
      country: "Bangladesh",
      coordinates: { lat: 21.2, lng: 92.05 },
    },
  },
  {
    id: "a2",
    title: "Late dinner",
    date: new Date("2030-01-15T00:00:00Z"),
    time: "23:30",
    location: { name: "Mermaid Cafe" },
  },
];

const now = new Date("2029-12-01T08:00:00Z");
const unfold = (text) => text.replace(/\r\n /g, "");

describe("escapeText", () => {
  it("escapes the characters RFC 5545 reserves in text", () => {
    expect(escapeText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("foldLine", () => {
  it("keeps short lines as they are", () => {
    expect(foldLine("SUMMARY:Hi")).toBe("SUMMARY:Hi");
  });

  it("folds long lines at 75 octets without splitting characters", () => {
    const line = `DESCRIPTION:${"ঢাকা ".repeat(40)}`;
    const folded = foldLine(line);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(Buffer.byteLength(part, "utf8")).toBeLessThanOrEqual(75);
      expect(part).not.toContain("�");
    }
    expect(unfold(folded)).toBe(line);
  });
});

describe("activityTimes", () => {
  it("returns a one-hour floating local time", () => {
    expect(activityTimes("2030-01-11T00:00:00Z", "09:05")).toEqual({
      start: "20300111T090500",
      end: "20300111T100500",
    });
  });

  it("rolls past midnight into the next day", () => {
    expect(activityTimes("2030-01-15T00:00:00Z", "23:30").end).toBe(
      "20300116T003000",
    );
  });
});

describe("buildTripCalendar", () => {
  const ics = buildTripCalendar({
    trip,
    activities,
    url: "https://travelo.example/share/abc",
    now,
  });
  const lines = unfold(ics).split("\r\n");

  it("uses CRLF line endings and wraps everything in a VCALENDAR", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("adds the trip as an all-day event with an exclusive end date", () => {
    expect(lines).toContain("UID:trip-trip1@travelo.app");
    expect(lines).toContain("DTSTART;VALUE=DATE:20300110");
    expect(lines).toContain("DTEND;VALUE=DATE:20300116");
    expect(lines).toContain("SUMMARY:Cox's Bazar\\, beach week");
    expect(lines).toContain(
      "DESCRIPTION:Sun\\; sea\\nand sand\\n\\nhttps://travelo.example/share/abc",
    );
    expect(lines).toContain("DTSTAMP:20291201T080000Z");
  });

  it("adds each activity with its time, place and coordinates", () => {
    expect(lines).toContain("UID:activity-a1@travelo.app");
    expect(lines).toContain("DTSTART:20300111T173000");
    expect(lines).toContain("DTEND:20300111T183000");
    expect(lines).toContain("SUMMARY:Sunset at Inani");
    expect(lines).toContain(
      "LOCATION:Inani Beach\\, Marine Drive\\, Cox's Bazar\\, Bangladesh",
    );
    expect(lines).toContain("GEO:21.2;92.05");

    expect(lines).toContain("UID:activity-a2@travelo.app");
    expect(lines).toContain("LOCATION:Mermaid Cafe");
    expect(lines.filter((line) => line === "BEGIN:VEVENT")).toHaveLength(3);
    expect(lines.filter((line) => line.startsWith("GEO:"))).toHaveLength(1);
  });

  it("works for a trip without activities or a link", () => {
    const empty = unfold(buildTripCalendar({ trip: { ...trip, description: "" }, now }));
    expect(empty).not.toContain("URL:");
    expect(empty).not.toContain("DESCRIPTION:");
    expect(empty.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
});

describe("calendarFileName", () => {
  it("turns the trip title into a safe file name", () => {
    expect(calendarFileName("Cox's Bazar, beach week!")).toBe(
      "coxs-bazar-beach-week.ics",
    );
    expect(calendarFileName('"; rm -rf')).toBe("rm-rf.ics");
    expect(calendarFileName("ঢাকা")).toBe("trip.ics");
  });
});
