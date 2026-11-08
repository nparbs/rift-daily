# Rift Daily

Three daily League of Legends word puzzles in one static web page, each with an unlimited practice mode:

- **Wordle**: spell the champion's name in six tries.
- **Connections**: sort 16 champions into four hidden groups of four.
- **Champion Guess**: guess any champion and see how its gender, position, species, resource, range, region and release year compare.

Everyone gets the same daily puzzle, picked from the player's local date (puzzle #1 is 2026-11-08). Stats and streaks are kept in the browser. There is no server code, so the answers can be found in the JS by anyone who looks.

## Files

- `index.html`, `style.css`, `js/`: the whole game. No build step.
- `js/data.js`: generated champion data. Don't edit it by hand.
- `scripts/extra.mjs`: hand-entered facts Data Dragon doesn't have (gender, positions, species, regions, release year). Champions missing from it still appear in Wordle, but not in Champion Guess or the attribute-based Connections groups.
- `js/categories.js`: hand-written Connections groups ("Throws a hook or chain" and so on). Groups made from the data (regions, species, years, name shapes) are built in `js/connections.js`.

## New patch or new champion

```sh
node scripts/build-data.mjs   # pulls the latest Data Dragon, rewrites js/data.js
```

It lists any champion with no entry in `scripts/extra.mjs`. Add one line for each, then run it again.

Adding champions changes which answer falls on each future day. Days already played aren't affected for players, since their saved game is checked against the answer.

## Running locally

Use the container. `index.html` loads its JS and CSS from a `/v/<hash>/` path that the image build fills in, so a plain static server won't work:

```sh
docker build -t rift-daily . && docker run --rm -p 8099:8080 rift-daily
```

Hosting at lol.parbs.online is covered in [docs/hosting.md](docs/hosting.md).

---

Rift Daily isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
