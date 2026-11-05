import { addDays, getEvents, localZone, rangeFor } from "./schedule.js"

const timezone = localZone()
const timezoneLabel = document.getElementById("timezone")
const searchInput = document.getElementById("search")
const rangeLabel = document.getElementById("range")
const eventsList = document.getElementById("events")
const refreshButton = document.getElementById("refresh")
const example = document.getElementById("example")
const copyCommandButton = document.getElementById("copy-command")
const periodButtons = document.querySelectorAll("[data-period]")

let selectedPeriod = "schedule"
let events = []
let latestRequest = 0

timezoneLabel.textContent = `Times in ${timezone.replaceAll("_", " ")}`

// Build one fight card from the schedule data
const createEvent = (event) => {
  const date = new Date(event.date)
  const month = new Intl.DateTimeFormat("en", { timeZone: timezone, month: "short" }).format(date)
  const day = new Intl.DateTimeFormat("en", { timeZone: timezone, day: "2-digit" }).format(date)
  const time = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)

  const card = document.createElement("details")
  card.classList.add("event")

  const summary = document.createElement("summary")
  const dateTile = document.createElement("div")
  const monthLabel = document.createElement("small")
  const dayLabel = document.createElement("b")
  const details = document.createElement("div")
  const name = document.createElement("h3")
  const subtitle = document.createElement("div")
  const cardLabel = document.createElement("span")
  const fightsList = document.createElement("ul")

  dateTile.classList.add("date-tile")
  monthLabel.textContent = month.toUpperCase()
  dayLabel.textContent = day
  dateTile.appendChild(monthLabel)
  dateTile.appendChild(dayLabel)

  name.textContent = event.name
  subtitle.classList.add("subtitle")
  subtitle.appendChild(document.createTextNode(`${time} \u00a0·\u00a0 ${event.venue}`))
  subtitle.appendChild(document.createElement("br"))
  subtitle.appendChild(document.createTextNode(event.location))
  details.appendChild(name)
  details.appendChild(subtitle)

  cardLabel.classList.add("card-link")
  cardLabel.textContent = "Fight card \u00a0 ↗"
  summary.appendChild(dateTile)
  summary.appendChild(details)
  summary.appendChild(cardLabel)
  card.appendChild(summary)

  fightsList.classList.add("fights")
  if (!event.fights.length) {
    const message = document.createElement("li")
    message.textContent = "Fight card not announced yet."
    fightsList.appendChild(message)
  }

  event.fights.forEach((fight) => {
    const row = document.createElement("li")
    const fighters = document.createElement("span")
    const division = document.createElement("span")
    fighters.textContent = fight.fighters.join(" vs. ")
    division.textContent = `${fight.division} · ${fight.status}`
    row.appendChild(fighters)
    row.appendChild(division)
    fightsList.appendChild(row)
  })
  card.appendChild(fightsList)

  return card
}

const renderEvents = () => {
  const search = searchInput.value.toLowerCase()
  const matches = events.filter((event) => {
    const fighters = event.fights.flatMap((fight) => fight.fighters).join(" ")
    return `${event.name} ${fighters}`.toLowerCase().includes(search)
  })

  eventsList.textContent = ""
  if (!matches.length) {
    const message = document.createElement("p")
    message.classList.add("state")
    message.appendChild(document.createTextNode("No matching upcoming events announced for this window."))
    message.appendChild(document.createElement("br"))
    message.appendChild(document.createTextNode("Try Upcoming or a different search."))
    eventsList.appendChild(message)
    return
  }

  matches.forEach((event) => {
    eventsList.appendChild(createEvent(event))
  })
}

const loadEvents = async () => {
  const request = ++latestRequest
  const range = rangeFor(selectedPeriod, { zone: timezone })
  rangeLabel.textContent = `${range.start} → ${addDays(range.end, -1)}`
  eventsList.innerHTML = '<p class="state">Loading the lineup…</p>'

  try {
    const result = await getEvents(range)
    // Dont let an older request replace a newer selection
    if (request !== latestRequest) return
    events = result
    renderEvents()
  } catch (error) {
    if (request !== latestRequest) return
    events = []
    eventsList.textContent = ""
    const message = document.createElement("p")
    message.classList.add("state")
    message.appendChild(document.createTextNode(`Couldn’t load the schedule. ${error.message}`))
    message.appendChild(document.createElement("br"))
    message.appendChild(document.createTextNode("Use Refresh to try again."))
    eventsList.appendChild(message)
  }
}

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period
    periodButtons.forEach((tab) => {
      tab.classList.toggle("active", tab === button)
      tab.setAttribute("aria-pressed", String(tab === button))
    })
    loadEvents()
  })
})

searchInput.addEventListener("input", renderEvents)
refreshButton.addEventListener("click", loadEvents)

document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    example.textContent = button.dataset.example
    copyCommandButton.dataset.copy = button.dataset.example
  })
})

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy)
      button.textContent = "Copied!"
    } catch {
      button.textContent = "Select to copy"
    }
    setTimeout(() => {
      button.textContent = "Copy"
    }, 1800)
  })
})

loadEvents()
