export const API =
  "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard";
export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export function dayInZone(date, zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function addDays(day, numberOfDays) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + numberOfDays);
  return date.toISOString().slice(0, 10);
}
export function rangeFor(
  period = "schedule",
  { now = new Date(), zone = localZone(), days = 180, from } = {},
) {
  let start = from || dayInZone(now, zone);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(start)) ||
    new Date(start).toISOString().slice(0, 10) !== start
  )
    throw new Error("Use a valid date: YYYY-MM-DD.");
  if (!Number.isInteger(days) || days < 1 || days > 366)
    throw new Error("--days must be between 1 and 366.");
  // Find Friday in the current week, then move ahead a week if needed.
  if (period === "this weekend" || period === "next weekend") {
    const weekday = new Date(`${start}T12:00:00Z`).getUTCDay();
    const mondayIndex = (weekday + 6) % 7;
    start = addDays(
      start,
      4 - mondayIndex + (period === "next weekend" ? 7 : 0),
    );
    return { start, end: addDays(start, 3), zone };
  }
  return { start, end: addDays(start, days), zone };
}
export function normalize(event) {
  const bouts = event.competitions || [];
  const venue = bouts.find((bout) => bout.venue)?.venue || {};
  return {
    id: String(event.id),
    name: event.name || "UFC event",
    date: event.date,
    completed: !!event.status?.type?.completed,
    venue: venue.fullName || "Venue TBA",
    location: [
      venue.address?.city,
      venue.address?.state,
      venue.address?.country,
    ]
      .filter(Boolean)
      .join(", "),
    fights: bouts.map((bout) => ({
      fighters: (bout.competitors || []).map(
        (competitor) => competitor.athlete?.displayName || "TBA",
      ),
      division: bout.type?.abbreviation || "TBA",
      status: bout.status?.type?.description || "Scheduled",
    })),
  };
}
export function filterEvents(raw, range, search = "") {
  return raw
    .map(normalize)
    .filter((event) => {
      if (
        !event.date ||
        !Number.isFinite(Date.parse(event.date)) ||
        event.completed
      )
        return false;
      const day = dayInZone(new Date(event.date), range.zone);
      return (
        day >= range.start &&
        day < range.end &&
        `${event.name} ${event.fights.flatMap((fight) => fight.fighters).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export async function getEvents(range, search = "", fetcher = fetch) {
  // Expand the UTC request so events near midnight in any timezone are included.
  const dates = `${addDays(range.start, -1).replaceAll("-", "")}-${range.end.replaceAll("-", "")}`;
  const response = await fetcher(
    `${API}?${new URLSearchParams({ dates, limit: "1000" })}`,
    { signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok)
    throw new Error(
      `Schedule provider returned HTTP ${response.status}. Try again shortly.`,
    );
  const data = await response.json();
  if (!Array.isArray(data.events))
    throw new Error("Unexpected response from the schedule provider.");
  return filterEvents(data.events, range, search);
}
