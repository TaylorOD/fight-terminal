#!/usr/bin/env node
import { getEvents, rangeFor, localZone } from "./schedule.js";
import { readFileSync } from "node:fs";
const version = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
).version;
const help = `Fight Terminal · UFC schedule

  fight schedule                  Upcoming events
  fight next                      Next event and fight card
  fight this weekend              This Friday through Sunday
  fight next weekend              Following Friday through Sunday
  fight card <ID or name>          Announced fights

Options: --search NAME, --days 180, --from YYYY-MM-DD,
         --tz America/Denver, --utc, --json, --help, --version, --list

Quoted weekend phrases work too. Weekends use your local timezone,
including the current weekend on Saturday/Sunday. --tz overrides it.
Times are event starts, not main-event walkouts. Source: ESPN.
`;
export async function main(args = process.argv.slice(2)) {
  const options = {};
  const words = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (["--help", "-h", "help", "--list", "-list", "list"].includes(arg)) {
      console.log(help);
      return;
    }
    if (["--version", "-v", "-V"].includes(arg)) {
      console.log(version);
      return;
    }
    if (["--json", "--utc"].includes(arg)) {
      options[arg.slice(2)] = true;
      continue;
    }
    if (["--search", "--days", "--from", "--tz"].includes(arg)) {
      if (!args[index + 1] || args[index + 1].startsWith("--"))
        throw new Error(`Missing value for ${arg}.`);
      options[arg.slice(2)] = args[++index];
      continue;
    }
    if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    words.push(arg);
  }
  const phrase = words.join(" ").toLowerCase();
  let command = words[0] || "schedule";
  if (["this weekend", "next weekend"].includes(phrase)) command = phrase;
  if (
    !["schedule", "next", "card", "this weekend", "next weekend"].includes(
      command,
    )
  )
    throw new Error("Unknown command. Run fight --help.");
  if (["schedule", "next"].includes(command) && words.length > 1)
    throw new Error("Unexpected arguments. Run fight --help.");
  const zone = options.utc ? "UTC" : options.tz || localZone();
  const range = rangeFor(command, {
    zone,
    days: Number(options.days ?? 180),
    from: options.from,
  });
  let events = await getEvents(range, options.search);
  if (command === "card" && words.length > 1) {
    const query = words.slice(1).join(" ").toLowerCase();
    events = events.filter(
      (event) => event.id === query || event.name.toLowerCase().includes(query),
    );
    if (events.length > 1)
      throw new Error("Multiple events match. Use an ID from fight schedule.");
  } else if (command === "next" || command === "card")
    events = events.slice(0, 1);
  if (options.json) {
    console.log(JSON.stringify(events, null, 2));
    return;
  }
  console.log(`\nFIGHT TERMINAL / ${command.toUpperCase()} / ${zone}\n`);
  if (!events.length)
    console.log("No matching upcoming events announced in this date range.");
  for (const event of events) {
    console.log(`${event.name}  [${event.id}]`);
    console.log(
      `  ${new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "short" }).format(new Date(event.date))}`,
    );
    console.log(`  ${event.venue} · ${event.location}`);
    if (command !== "schedule")
      for (const fight of event.fights)
        console.log(
          `  ${fight.fighters.join(" vs. ")} (${fight.division}) [${fight.status}]`,
        );
    if (command !== "schedule" && !event.fights.length)
      console.log("  Fight card not announced yet.");
    console.log();
  }
  console.log("Source: ESPN. Cards and event start times may change.");
}
main().catch((error) => {
  console.error(`fight: ${error.message}`);
  process.exitCode = 1;
});
