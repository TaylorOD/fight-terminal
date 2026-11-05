# fight terminal

check upcoming ufc events and fight cards from your terminal. you can also use the [website](https://www.taylordorsett.com/fight-terminal/).

## install

requires node.js 22 or newer. no api key needed.

```sh
npm install -g fight-terminal
```

## use it

```sh
fight                     # upcoming events
fight this weekend        # this friday through sunday
fight next weekend        # next friday through sunday
fight next                # next event and fight card
fight card "Walker"       # find a card by name or event id
fight schedule --search "Jones"
```

see all commands and options with `fight --list` or `fight -list`. use `fight --help` for help and `fight -v` for the version.

run it once without installing it globally:

```sh
npx fight-terminal this weekend
```

## options

use `--days 365` to look further ahead, `--from 2026-11-06` to start from a date, or `--search NAME` to find an event or fighter. add `--json` for machine readable output. times use your computer's timezone. use `--tz America/Denver` to pick another timezone or `--utc` for utc.

weekends run friday through sunday in the chosen timezone. this weekend includes the current weekend on saturday and sunday. next weekend is the following friday through sunday.

## run it locally

```sh
node --test
node server.js
```

open http://localhost:3000 for the website. the cli and site both need an internet connection.

data comes from espn's public scoreboard. fight cards, locations and start times may change. times are event start times, not main event walkouts. this project is not affiliated with ufc or espn.
