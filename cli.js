#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { getEvents, rangeFor, localZone } from "./schedule.js";

const packageInfo = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

const help = `Fight Terminal · UFC schedule

  fight schedule                  Upcoming events
  fight next                      Next event and fight card
  fight this weekend              This Friday through Sunday
  fight next weekend              Following Friday through Sunday
  fight card <ID or name>         Announced fights

Options: --search NAME, --days 180, --from YYYY-MM-DD,
         --tz America/Denver, --utc, --json, --help, --version, --list

Quoted weekend phrases work too. Weekends use your local timezone,
including the current weekend on Saturday/Sunday. --tz overrides it.
Times are event starts, not main-event walkouts. Source: ESPN.
`;

function parseArguments(args) {
  const options = {};
  const words = [];
  const helpOptions = ["--help", "-h", "help", "--list", "-list", "list"];
  const versionOptions = ["--version", "-v", "-V"];
  const valueOptions = ["--search", "--days", "--from", "--tz"];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (helpOptions.includes(arg)) {
      return { action: "help" };
    }
    if (versionOptions.includes(arg)) {
      return { action: "version" };
    }
    if (arg === "--json" || arg === "--utc") {
      options[arg.slice(2)] = true;
      continue;
    }
    if (valueOptions.includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}.`);
      }
      options[arg.slice(2)] = value;
      index++;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    words.push(arg);
  }

  const phrase = words.join(" ").toLowerCase();
  const command = ["this weekend", "next weekend"].includes(phrase)
    ? phrase
    : words[0] || "schedule";
  const commands = ["schedule", "next", "card", "this weekend", "next weekend"];

  if (!commands.includes(command)) {
    throw new Error("Unknown command. Run fight --help.");
  }
  if (["schedule", "next"].includes(command) && words.length > 1) {
    throw new Error("Unexpected arguments. Run fight --help.");
  }

  return { command, options, words };
}

function selectEvents(events, command, words) {
  if (command === "card" && words.length > 1) {
    const search = words.slice(1).join(" ").toLowerCase();
    const matches = events.filter((event) => {
      return event.id === search || event.name.toLowerCase().includes(search);
    });

    if (matches.length > 1) {
      throw new Error("Multiple events match. Use an ID from fight schedule.");
    }
    return matches;
  }

  if (command === "next" || command === "card") {
    return events.slice(0, 1);
  }
  return events;
}

function printEvents(events, command, timezone) {
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    dateStyle: "full",
    timeStyle: "short",
  });

  console.log(`\nFIGHT TERMINAL / ${command.toUpperCase()} / ${timezone}\n`);
  if (!events.length) {
    console.log("No matching upcoming events announced in this date range.");
  }

  for (const event of events) {
    console.log(`${event.name}  [${event.id}]`);
    console.log(`  ${dateFormat.format(new Date(event.date))}`);
    console.log(`  ${event.venue} · ${event.location}`);

    if (command !== "schedule") {
      for (const fight of event.fights) {
        console.log(`  ${fight.fighters.join(" vs. ")} (${fight.division}) [${fight.status}]`);
      }
      if (!event.fights.length) {
        console.log("  Fight card not announced yet.");
      }
    }
    console.log();
  }
  console.log("Source: ESPN. Cards and event start times may change.");
}

export async function main(args = process.argv.slice(2)) {
  const { action, command, options, words } = parseArguments(args);
  if (action === "help") {
    console.log(help);
    return;
  }
  if (action === "version") {
    console.log(packageInfo.version);
    return;
  }

  const timezone = options.utc ? "UTC" : options.tz || localZone();
  const range = rangeFor(command, {
    zone: timezone,
    days: Number(options.days ?? 180),
    from: options.from,
  });
  const events = await getEvents(range, options.search);
  const selectedEvents = selectEvents(events, command, words);

  if (options.json) {
    console.log(JSON.stringify(selectedEvents, null, 2));
  } else {
    printEvents(selectedEvents, command, timezone);
  }
}

main().catch((error) => {
  console.error(`fight: ${error.message}`);
  process.exitCode = 1;
});
