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

## built with

node.js for the command line tool. html, css and javascript for the website. espn's public scoreboard for event data. github pages for hosting.

## run it locally

```sh
node --test
node server.js
```

open http://localhost:3000 for the website. the cli and site both need an internet connection.

## code

`cli.js` handles terminal commands. `schedule.js` gets and filters events for both the cli and website. `app.js` renders the website, and `server.js` serves it locally.

fight cards follow the order provided by espn, which may not put the main event first. fight cards, locations and start times may change. times are event start times, not main event walkouts. this project is not affiliated with ufc or espn.
