import { CHAMPS } from "./data.js";
import { TRIVIA } from "./categories.js";
import { dayNumber, el, iconUrl, load, randomSeed, recordResult, resultPanel, rng, save, shuffle, toast } from "./util.js";

const BY_ID = Object.fromEntries(CHAMPS.map((c) => [c.id, c]));
const MISTAKES = 4;
const COLORS = ["yellow", "green", "blue", "purple"];
const EMOJI = { yellow: "🟨", green: "🟩", blue: "🟦", purple: "🟪" };

// Build every candidate group. `kind` limits each puzzle to one group per kind
// so you don't get two region groups at once.
function allGroups() {
  const groups = TRIVIA.map((t) => ({ ...t, kind: "trivia:" + t.label, ids: t.ids.filter((id) => BY_ID[id]) }));
  const facts = CHAMPS.filter((c) => c.year);
  const add = (kind, label, diff, pred, src = facts) =>
    groups.push({ kind, label, diff, ids: src.filter(pred).map((c) => c.id) });

  for (const r of new Set(facts.flatMap((c) => c.regions)))
    if (r !== "Runeterra") add("region", `From ${r}`, 1, (c) => c.regions.includes(r));
  const speciesName = { Yordle: "Yordles", Vastayan: "Vastaya", "Void-Being": "Void creatures", Darkin: "Darkin", Ascended: "Ascended", Undead: "Undead", Celestial: "Celestial beings", Golem: "Golems and constructs", Demon: "Demons", Spirit: "Spirits", Demigod: "Demigods", Cyborg: "Cyborgs", "Chemtech Mutant": "Chemtech mutants" };
  for (const [s, label] of Object.entries(speciesName)) add("species", label, s === "Yordle" ? 1 : 2, (c) => c.species.includes(s));
  add("resource", "Uses energy", 3, (c) => c.resource === "Energy");
  add("resource", "No mana bar at all", 3, (c) => c.resource === "None");
  add("resource", "Fury, rage, heat or another odd bar", 3, (c) => c.resource === "Other");
  for (const y of new Set(facts.map((c) => c.year)))
    add("year", `Released in ${y}`, y === 2009 ? 3 : 4, (c) => c.year === y);
  add("name", "Apostrophe in the name", 1, (c) => c.name.includes("'"), CHAMPS);
  add("name", "Three-letter names", 2, (c) => /^[A-Za-z]{3}$/.test(c.name), CHAMPS);
  add("name", "Two-word names", 2, (c) => / /.test(c.name) && !c.name.includes("&") && !c.name.includes("."), CHAMPS);
  add("name", "Same letter at start and end", 4, (c) => {
    const n = c.name.toLowerCase().replace(/[^a-z]/g, "");
    return n[0] === n.at(-1);
  }, CHAMPS);
  add("name", "Names with a double letter", 3, (c) => /([a-z])\1/i.test(c.name), CHAMPS);
  add("title", '"Blade" in their title', 3, (c) => /blade/i.test(c.title), CHAMPS);
  add("title", "Royalty in their title", 3, (c) => /queen|king|emperor|empress/i.test(c.title), CHAMPS);
  return groups.filter((g) => g.ids.length >= 4);
}
const GROUPS = allGroups();

export function generate(seed) {
  const rand = rng(seed);
  for (let attempt = 0; attempt < 500; attempt++) {
    const picked = [];
    for (const g of shuffle(GROUPS, rand)) {
      if (picked.length === 4) break;
      if (picked.some((p) => p.kind === g.kind)) continue;
      picked.push(g);
    }
    if (picked.length < 4) continue;
    // Tiles may only belong to one of the four chosen groups.
    const sets = picked.map((g) => new Set(g.ids));
    const chosen = [];
    let ok = true;
    for (let i = 0; i < 4; i++) {
      const only = picked[i].ids.filter((id) => sets.every((s, j) => j === i || !s.has(id)) && !chosen.flat().includes(id));
      if (only.length < 4) { ok = false; break; }
      chosen.push(shuffle(only, rand).slice(0, 4));
    }
    if (!ok) continue;
    const order = picked.map((g, i) => ({ g, ids: chosen[i], r: rand() })).sort((a, b) => a.g.diff - b.g.diff || a.r - b.r);
    return order.map((o, i) => ({ label: o.g.label, color: COLORS[i], ids: o.ids }));
  }
  throw new Error("Could not build a puzzle");
}

export function mount(root, { practice, onPractice }) {
  const day = dayNumber();
  const seed = practice ? randomSeed() : day * 104729 + 3;
  const puzzle = generate(seed);
  const key = "conn:" + day;
  let st = practice ? null : load(key, null);
  if (!st || st.seed !== seed) {
    st = { seed, solved: [], mistakes: 0, guesses: [], done: false, won: false,
      order: shuffle(puzzle.flatMap((g) => g.ids), rng(seed + 1)) };
  }
  let sel = new Set();

  const solvedBox = el("div", { class: "csolved" });
  const grid = el("div", { class: "cgrid" });
  const dots = el("div", { class: "dots" });
  const controls = el("div", { class: "row center" });
  const end = el("div");
  root.append(el("p", { class: "muted center" }, "Find four groups of four champions."), solvedBox, grid, dots, controls, end);

  const btnShuffle = el("button", { class: "btn", onclick: () => {
    const rest = st.order.filter((id) => !isSolved(id));
    st.order = [...st.order.filter(isSolved), ...shuffle(rest, Math.random)];
    render();
  } }, "Shuffle");
  const btnClear = el("button", { class: "btn", onclick: () => { sel.clear(); render(); } }, "Deselect");
  const btnSubmit = el("button", { class: "btn primary", onclick: submit }, "Submit");
  controls.append(btnShuffle, btnClear, btnSubmit);

  function isSolved(id) {
    return st.solved.some((i) => puzzle[i].ids.includes(id));
  }

  function groupRow(g) {
    return el("div", { class: `cgroup ${g.color}` },
      el("b", {}, g.label),
      el("span", {}, g.ids.map((id) => BY_ID[id].name).join(", ")));
  }

  function render() {
    solvedBox.replaceChildren(...st.solved.map((i) => groupRow(puzzle[i])));
    grid.replaceChildren();
    for (const id of st.order) {
      if (isSolved(id)) continue;
      const c = BY_ID[id];
      grid.append(el("button", {
        class: "ctile" + (sel.has(id) ? " sel" : ""),
        onclick: () => {
          if (st.done) return;
          if (sel.has(id)) sel.delete(id);
          else if (sel.size < 4) sel.add(id);
          render();
        },
      }, el("img", { src: iconUrl(id), alt: "", loading: "lazy" }), el("span", {}, c.name)));
    }
    dots.replaceChildren("Mistakes left: ", ...Array.from({ length: MISTAKES }, (_, i) =>
      el("i", { class: i < MISTAKES - st.mistakes ? "dot" : "dot used" })));
    btnSubmit.disabled = sel.size !== 4;
    btnClear.disabled = sel.size === 0;
    if (st.done) showEnd();
  }

  function submit() {
    if (sel.size !== 4 || st.done) return;
    const guess = [...sel].sort();
    if (st.guesses.some((g) => g.join() === guess.join())) return toast("Already guessed");
    st.guesses.push(guess);
    const hit = puzzle.findIndex((g) => guess.every((id) => g.ids.includes(id)));
    if (hit >= 0) {
      st.solved.push(hit);
      sel.clear();
      if (st.solved.length === 4) st.done = st.won = true;
    } else {
      st.mistakes++;
      const best = Math.max(...puzzle.map((g) => guess.filter((id) => g.ids.includes(id)).length));
      if (st.mistakes >= MISTAKES) {
        st.done = true;
        for (let i = 0; i < 4; i++) if (!st.solved.includes(i)) st.solved.push(i);
      } else toast(best === 3 ? "One away..." : "Not a group");
      grid.classList.remove("shake");
      void grid.offsetWidth;
      grid.classList.add("shake");
    }
    if (!practice) {
      save(key, st);
      if (st.done) recordResult("connections", day, st.won);
    }
    render();
  }

  function showEnd() {
    controls.remove();
    dots.remove();
    const colorOf = (id) => puzzle.find((g) => g.ids.includes(id)).color;
    const rows = st.guesses.map((g) => g.map((id) => EMOJI[colorOf(id)]).join("")).join("\n");
    end.replaceChildren(resultPanel({
      title: st.won ? (st.mistakes === 0 ? "Perfect!" : `Solved with ${st.mistakes} mistake${st.mistakes > 1 ? "s" : ""}`) : "Out of mistakes",
      mode: "connections", practice, onPractice,
      shareText: `Rift Daily Connections ${practice ? "Practice" : "#" + day}\n${rows}\nlol.parbs.online`,
    }));
  }

  render();
}
