# fight terminal

check upcoming ufc events and fight cards from your terminal.

requires node.js 22 or newer. no api key needed.

```sh
npm install -g fight-terminal
fight this weekend
fight next weekend
fight next
fight --list
fight --help
fight --version
```

run once without a global install with `npx fight-terminal this weekend`.

use `fight schedule` for upcoming events, `fight card NAME` for a specific card, or `fight schedule --search NAME` to find a fighter. add `--json` for machine readable output. use `--tz America/Denver` or `--utc` to choose a timezone.

weekends run friday through sunday in the chosen timezone. this weekend includes the current weekend on saturday and sunday.

data comes from espn's public scoreboard. fight cards, locations and start times may change.

[visit the website](https://www.taylordorsett.com/fight-terminal/)
