function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildDateWindow(anchorDates: string[], bufferDays = 1): { from: string; to: string } {
  const times = anchorDates.map((date) => toDate(date).getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));
  from.setUTCDate(from.getUTCDate() - bufferDays);
  to.setUTCDate(to.getUTCDate() + bufferDays);
  return { from: formatDate(from), to: formatDate(to) };
}

function minutes(time?: string): number | undefined {
  if (!time) return undefined;
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

export function detectConflict(
  left: { date: string; startTime?: string; endTime?: string },
  right: { date: string; startTime?: string; endTime?: string },
): boolean {
  if (left.date !== right.date) return false;
  const leftStart = minutes(left.startTime);
  const rightStart = minutes(right.startTime);
  if (leftStart === undefined || rightStart === undefined) return false;
  const leftEnd = minutes(left.endTime) ?? leftStart + 120;
  const rightEnd = minutes(right.endTime) ?? rightStart + 120;
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function summarizeResearch(event: {
  eventId: string;
  descriptionText?: string;
  relatedLinks: Array<{ url: string }>;
}) {
  const text = event.descriptionText ?? "";
  const inlineUrls = Array.from(text.matchAll(/https?:\/\/[^\s<>"）)]+/g)).map((match) => match[0]);
  const ticketUrls = [...inlineUrls, ...event.relatedLinks.map((link) => link.url)].filter(
    (url) =>
      /eplus|tiget|livepocket|l-tike|ticket|pia/i.test(url) &&
      !/^https?:\/\/support-qa\.eplus\.jp(?:[/:?#]|$)/i.test(url),
  );
  const price = text.match(/(?:料金|一般指定席|全席指定)[^。]*(?:円|税込)/)?.[0];
  const reception = text.match(/受付期間[:：][^。]+/)?.[0];
  return {
    eventId: event.eventId,
    sourceUrls: event.relatedLinks.map((link) => link.url),
    ticketUrls: Array.from(new Set(ticketUrls)),
    summary: [price, reception].filter(Boolean).join(" / ") || "参加方式はEventernote本文と関連リンクを確認",
    warnings: [] as string[],
  };
}
