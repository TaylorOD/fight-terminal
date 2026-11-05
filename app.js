import { addDays, getEvents, localZone, rangeFor } from "./schedule.js";

const timezone = localZone();
const element = (id) => document.getElementById(id);

let selectedPeriod = "schedule";
let events = [];
let latestRequest = 0;

element("timezone").textContent = `Times in ${timezone.replaceAll("_", " ")}`;

// ESPN data is inserted into HTML, so escape it before rendering.
function escapeHtml(value) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => characters[character],
  );
}

function renderFight(fight) {
  return `
    <li>
      <span>${escapeHtml(fight.fighters.join(" vs. "))}</span>
      <span>${escapeHtml(fight.division)} · ${escapeHtml(fight.status)}</span>
    </li>`;
}

function renderEvent(event) {
  const date = new Date(event.date);
  const month = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    month: "short",
  }).format(date);
  const day = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    day: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    weekday: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);

  const fights = event.fights.length
    ? event.fights.map(renderFight).join("")
    : "<li>Fight card not announced yet.</li>";

  return `
    <details class="event">
      <summary>
        <div class="date-tile"><small>${escapeHtml(month.toUpperCase())}</small><b>${escapeHtml(day)}</b></div>
        <div>
          <h3>${escapeHtml(event.name)}</h3>
          <div class="subtitle">${escapeHtml(time)} &nbsp;·&nbsp; ${escapeHtml(event.venue)}<br>${escapeHtml(event.location)}</div>
        </div>
        <span class="card-link">Fight card &nbsp; ↗</span>
      </summary>
      <ul class="fights">${fights}</ul>
    </details>`;
}

function renderEvents() {
  const search = element("search").value.toLowerCase();
  const matches = events.filter((event) => {
    const fighters = event.fights.flatMap((fight) => fight.fighters).join(" ");
    return `${event.name} ${fighters}`.toLowerCase().includes(search);
  });

  if (!matches.length) {
    element("events").innerHTML =
      '<p class="state">No matching upcoming events announced for this window.<br>Try Upcoming or a different search.</p>';
    return;
  }

  element("events").innerHTML = matches.map(renderEvent).join("");
}

async function loadEvents() {
  const request = ++latestRequest;
  const range = rangeFor(selectedPeriod, { zone: timezone });
  element("range").textContent = `${range.start} → ${addDays(range.end, -1)}`;
  element("events").innerHTML = '<p class="state">Loading the lineup…</p>';

  try {
    const result = await getEvents(range);
    // Ignore an older response if the user has already picked another period.
    if (request !== latestRequest) return;
    events = result;
    renderEvents();
  } catch (error) {
    if (request !== latestRequest) return;
    events = [];
    element("events").innerHTML =
      `<p class="state">Couldn’t load the schedule. ${escapeHtml(error.message)}<br>Use Refresh to try again.</p>`;
  }
}

document.querySelectorAll("[data-period]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period;
    document.querySelectorAll("[data-period]").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
      tab.setAttribute("aria-pressed", String(tab === button));
    });
    loadEvents();
  });
});

element("search").addEventListener("input", renderEvents);
element("refresh").addEventListener("click", loadEvents);

document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    element("example").textContent = button.dataset.example;
    element("copy-command").dataset.copy = button.dataset.example;
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Copied!";
    } catch {
      button.textContent = "Select to copy";
    }
    setTimeout(() => {
      button.textContent = "Copy";
    }, 1800);
  });
});

loadEvents();
