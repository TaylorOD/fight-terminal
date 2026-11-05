# fight terminal

check upcoming ufc events and fight cards from your terminal.

requires node.js 22 or newer. no api key needed.

```sh
npm install -g fight-terminal
ufc this weekend
ufc next weekend
ufc next
ufc --list
ufc --help
ufc --version
```

run once without a global install with `npx fight-terminal this weekend`.

use `ufc schedule` for upcoming events, `ufc card NAME` for a specific card, or `ufc schedule --search NAME` to find a fighter. add `--json` for machine readable output. use `--tz America/Denver` or `--utc` to choose a timezone.

weekends run friday through sunday in the chosen timezone. this weekend includes the current weekend on saturday and sunday.

data comes from espn's public scoreboard. fight cards, locations and start times may change.

[visit the website](https://www.taylordorsett.com/fight-terminal/)
