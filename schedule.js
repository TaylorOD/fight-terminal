export const API = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"

export const localZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export const dayInZone = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year").value
  const month = parts.find((part) => part.type === "month").value
  const day = parts.find((part) => part.type === "day").value
  return `${year}-${month}-${day}`
}

export const addDays = (day, numberOfDays) => {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + numberOfDays)
  return date.toISOString().slice(0, 10)
}

// Find the dates to check for a schedule or a weekend
export const rangeFor = (
  period = "schedule",
  { now = new Date(), zone = localZone(), days = 180, from } = {},
) => {
  let start = from || dayInZone(now, zone)
  const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(start)
  const validDate = Number.isFinite(Date.parse(start)) && new Date(start).toISOString().slice(0, 10) === start

  if (!validFormat || !validDate) {
    throw new Error("Use a valid date: YYYY-MM-DD.")
  }
  if (!Number.isInteger(days) || days < 1 || days > 366) {
    throw new Error("--days must be between 1 and 366.")
  }

  if (period === "this weekend" || period === "next weekend") {
    // Friday through Sunday, based on the selected timezone.
    const weekday = new Date(`${start}T12:00:00Z`).getUTCDay()
    const daysSinceMonday = (weekday + 6) % 7
    const nextWeek = period === "next weekend" ? 7 : 0
    start = addDays(start, 4 - daysSinceMonday + nextWeek)
    return { start, end: addDays(start, 3), zone }
  }

  return { start, end: addDays(start, days), zone }
}

// Pull out the event details the site and cli use
export const normalize = (event) => {
  const bouts = event.competitions || []
  const venue = bouts.find((bout) => bout.venue)?.venue || {}
  const location = [venue.address?.city, venue.address?.state, venue.address?.country]
    .filter(Boolean)
    .join(", ")
  const fights = bouts.map((bout) => ({
    fighters: (bout.competitors || []).map((fighter) => fighter.athlete?.displayName || "TBA"),
    division: bout.type?.abbreviation || "TBA",
    status: bout.status?.type?.description || "Scheduled",
  }))

  return {
    id: String(event.id),
    name: event.name || "UFC event",
    date: event.date,
    completed: !!event.status?.type?.completed,
    venue: venue.fullName || "Venue TBA",
    location,
    fights,
  }
}

export const filterEvents = (rawEvents, range, search = "") => {
  const matches = rawEvents.map(normalize).filter((event) => {
    if (!event.date || !Number.isFinite(Date.parse(event.date)) || event.completed) {
      return false
    }

    const day = dayInZone(new Date(event.date), range.zone)
    const fighterNames = event.fights.flatMap((fight) => fight.fighters).join(" ")
    const searchableText = `${event.name} ${fighterNames}`.toLowerCase()
    return day >= range.start && day < range.end && searchableText.includes(search.toLowerCase())
  })

  return matches.sort((first, second) => Date.parse(first.date) - Date.parse(second.date))
}

// Get the latest schedule from ESPN
export const getEvents = async (range, search = "", fetcher = fetch) => {
  // Include an extra UTC day so events near midnight are not missed.
  const start = addDays(range.start, -1).replaceAll("-", "")
  const end = range.end.replaceAll("-", "")
  const query = new URLSearchParams({ dates: `${start}-${end}`, limit: "1000" })
  const response = await fetcher(`${API}?${query}`, {
    signal: AbortSignal.timeout(20000),
  })

  if (!response.ok) {
    throw new Error(`Schedule provider returned HTTP ${response.status}. Try again shortly.`)
  }

  const data = await response.json()
  if (!Array.isArray(data.events)) {
    throw new Error("Unexpected response from the schedule provider.")
  }

  return filterEvents(data.events, range, search)
}
