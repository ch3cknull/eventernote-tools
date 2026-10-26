import { describe, expect, it } from "vitest";
import { buildDateWindow, detectConflict, summarizeResearch } from "../src/services/context.js";

describe("planning context helpers", () => {
  it("builds default one-day buffer windows", () => {
    expect(buildDateWindow(["2025-12-07"], 1)).toEqual({ from: "2025-12-06", to: "2025-12-08" });
  });

  it("detects event time overlap", () => {
    expect(
      detectConflict(
        { date: "2025-12-07", startTime: "17:35", endTime: "20:45" },
        { date: "2025-12-07", startTime: "19:00", endTime: "21:00" },
      ),
    ).toBe(true);
  });

  it("extracts ticket URLs and compact research text", () => {
    const summary = summarizeResearch({
      eventId: "433454",
      descriptionText: "受付URL：https://eplus.jp/ras-togetoge/ 料金 一般指定席：11,000円(税込)",
      relatedLinks: [{ url: "https://bang-dream.com/events/ras-togetoge" }],
    });
    expect(summary.ticketUrls).toContain("https://eplus.jp/ras-togetoge/");
    expect(summary.summary).toContain("11,000円");
  });

  it("keeps eplus customer support links as sources without treating them as ticket links", () => {
    const supportUrl = "https://support-qa.eplus.jp/hc/ja/";
    const ticketUrl = "https://eplus.jp/example/";
    const summary = summarizeResearch({
      eventId: "496259",
      descriptionText: `チケットのお問い合わせ ${supportUrl}`,
      relatedLinks: [{ url: supportUrl }, { url: ticketUrl }],
    });

    expect(summary.sourceUrls).toEqual([supportUrl, ticketUrl]);
    expect(summary.ticketUrls).toEqual([ticketUrl]);
  });
});
