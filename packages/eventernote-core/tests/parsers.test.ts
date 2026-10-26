import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseActorSearch } from "../src/parsers/actor-search.js";
import { parseEventCards, parseTotalCount } from "../src/parsers/event-card.js";
import { parseEventDetail } from "../src/parsers/event-detail.js";
import { parsePlaceDetail } from "../src/parsers/place-detail.js";
import { parsePlaceSearch } from "../src/parsers/place-search.js";
import { summarizeResearch } from "../src/services/context.js";

const fixture = (name: string) => readFileSync(join(import.meta.dirname, "fixtures", name), "utf8");

describe("event card parser", () => {
  it("parses actor event list cards using ids and compact fields", () => {
    const events = parseEventCards(fixture("actor-events-raychell-page2.html"));
    expect(events.length).toBeGreaterThan(5);
    expect(events[0]).toMatchObject({
      eventId: "476872",
      date: "2026-05-15",
      startTime: "14:00",
      endTime: "16:00",
      placeId: "61"
    });
    expect(events[0]?.performers.some((actor) => actor.actorId === "16232")).toBe(true);
    expect("participantCount" in events[0]!).toBe(false);
  });

  it("parses place event list cards with the same parser", () => {
    const events = parseEventCards(fixture("place-events-ariake-page2.html"));
    expect(events[0]).toMatchObject({
      eventId: "430691",
      date: "2026-04-19",
      placeId: "11572"
    });
  });

  it("parses total counts from list pages", () => {
    expect(parseTotalCount(fixture("actor-events-raychell-page2.html"))).toBe(303);
    expect(parseTotalCount(fixture("place-events-ariake-page2.html"))).toBe(222);
  });
});

describe("entity search parsers", () => {
  it("parses actor search candidates", () => {
    const actors = parseActorSearch(fixture("actor-search-raychell.html"));
    expect(actors.map((actor) => actor.actorId)).toEqual(["16232", "39397"]);
    expect(actors[0]).toMatchObject({ name: "Raychell", kana: "れいちぇる" });
    expect("eventCount" in actors[0]!).toBe(false);
  });

  it("parses place search candidates", () => {
    const places = parsePlaceSearch(fixture("place-search-ariake.html"));
    expect(places.some((place) => place.placeId === "11572")).toBe(true);
    expect(places.find((place) => place.placeId === "11572")).toMatchObject({
      name: "有明アリーナ",
      prefecture: "東京都"
    });
  });
});

describe("detail parsers", () => {
  it("parses event detail tables and participation-relevant description text", () => {
    const detail = parseEventDetail(fixture("event-detail-433454.html"), "433454");
    expect(detail).toMatchObject({
      eventId: "433454",
      date: "2025-12-07",
      startTime: "17:35",
      endTime: "20:45",
      placeId: "8574"
    });
    expect(detail.performers.map((actor) => actor.actorId)).toContain("39397");
    expect(detail.relatedLinks.length).toBeGreaterThan(1);
    expect(detail.descriptionText).toContain("受付期間");
    expect("participantCount" in detail).toBe(false);
  });

  it("parses place detail table and embedded events", () => {
    const detail = parsePlaceDetail(fixture("place-detail-blackbox.html"), "25879");
    expect(detail.place).toMatchObject({
      placeId: "25879",
      name: "BLACKBOX イベントホール",
      tips: "青森駅から徒歩7分 青森空港からタクシーで約30分・バスで約35分"
    });
    expect(detail.events.map((event) => event.eventId)).toContain("469944");
  });

  it("keeps description links separate from prose and preserves ticket anchor targets", () => {
    const html = fixture("event-detail-ticket-links.html").replace(
      />\s+</g,
      "><",
    );
    const detail = parseEventDetail(html, "496259");

    expect(detail.descriptionText).toContain(
      "https://bang-dream.com/discographies/4215/ ※チケット",
    );
    expect(detail.descriptionText).toContain(
      "申込はこちら https://eplus.jp/example/",
    );
    expect(detail.descriptionText).toContain(
      "https://tiget.net/events/12345 ※受付終了",
    );
    expect(detail.relatedLinks).toEqual([
      {
        label: "イベント公式サイト",
        url: "https://bang-dream.com/events/example/",
      },
    ]);
    expect(summarizeResearch(detail).ticketUrls).toEqual([
      "https://eplus.jp/example/",
      "https://tiget.net/events/12345",
    ]);
  });
});
