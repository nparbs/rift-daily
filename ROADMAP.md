# Roadmap

Rift Daily is a static site with three daily League of Legends puzzles, live at https://lol.parbs.online.

## Done

### v0.1: first release (2026-11-08)
- **Hub page** with a card for each mode, showing whether today's puzzle is done and the current streak.
- **Wordle**: guess the daily champion's name (letters only, 4–9 letters) in six tries. On-screen and physical keyboard, and the correct handling of repeated letters.
- **Connections**: 16 champion portraits, four hidden groups, four mistakes allowed, "One away..." hint, shuffle and deselect. Groups come from the data (regions, species, resources, release years, name shapes, titles) and from 21 hand-written trivia groups. The generator only uses tiles that fit exactly one of the four chosen groups, so every puzzle has a single answer.
- **Champion Guess**: search any champion and compare gender, position, species, resource, range, region and release year (green, orange for partial, red, plus arrows for the year). Narrow screens get a stacked layout so every column fits.
- **Daily and practice**: everyone gets the same puzzle each day, based on their local date (#1 is 2026-11-08). Daily answers go through a fixed shuffle, so none repeats until the whole pool has been used. Practice mode gives unlimited random puzzles.
- **Progress**: daily games save as you play, plus stats, streaks, a share button that copies an emoji grid, and a countdown to the next puzzle.
- **Data**: `scripts/build-data.mjs` pulls champions from Riot's Data Dragon (16.22.1, 173 champions) and merges hand-entered facts from `scripts/extra.mjs`.
- **Hosting**: unprivileged nginx container on the Debian VM, reached through Scrap Riot's Cloudflare Tunnel at lol.parbs.online. Deploy uses an SSH key locked to `~/deploy-rift-daily.sh`. Security headers: CSP, nosniff, read-only container with all capabilities dropped.
- **Caching fix**: Cloudflare caches JS/CSS for 4 hours, so the Docker build stamps a content hash into the asset paths (`/v/<hash>/...`). Each deploy shows up immediately.
- **CSP** allows the Cloudflare Web Analytics beacon. Cloudflare's injected bot-detection inline script is blocked on purpose.

## In progress
- **Champion guide**: a button on every page that opens an overlay listing every champion with their portrait.

## Next
- Fill in facts for **Locke** and **Zaahen** (currently Wordle-only) and double-check the hand-entered facts in `scripts/extra.mjs`.
- More hand-written Connections groups, and a review of the existing ones for missing members (e.g. "Fights with a gun").
- A word list for Wordle, so a guess must be a real word or champion name instead of any letters.
- A "how to play" note for each mode on first visit.

## Ideas
- More modes: ability-name reveal, champion from a cropped splash art, emoji clues.
- Hide answers from the page source (would need a small API instead of a static site).
- Global stats such as "% of players solved today" (also needs a server).
