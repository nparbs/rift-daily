import { CHAMPS } from "./data.js";
import { dailyPick, dayNumber, el, iconUrl, load, randomSeed, recordResult, resultPanel, rng, save } from "./util.js";

export const POOL = CHAMPS.filter((c) => c.year);
const BY_ID = Object.fromEntries(POOL.map((c) => [c.id, c]));
const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");

const COLS = [
  { key: "gender", label: "Gender" },
  { key: "positions", label: "Position" },
  { key: "species", label: "Species" },
  { key: "resource", label: "Cost" },
  { key: "range", label: "Range" },
  { key: "regions", label: "Region" },
  { key: "year", label: "Year" },
];

function compare(g, a, key) {
  const gv = g[key], av = a[key];
  if (key === "year") return { cls: gv === av ? "correct" : "absent", arrow: gv < av ? "↑" : gv > av ? "↓" : "" };
  if (Array.isArray(gv)) {
    const same = gv.length === av.length && gv.every((x) => av.includes(x));
    return { cls: same ? "correct" : gv.some((x) => av.includes(x)) ? "present" : "absent" };
  }
  return { cls: gv === av ? "correct" : "absent" };
}

export function mount(root, { practice, onPractice }) {
  const day = dayNumber();
  const answer = practice ? POOL[Math.floor(rng(randomSeed())() * POOL.length)] : dailyPick(POOL, day, 2);
  const key = "guess:" + day;
  let st = practice ? null : load(key, null);
  if (!st || st.answer !== answer.id) st = { answer: answer.id, guesses: [], done: false };

  const input = el("input", { type: "text", placeholder: "Type a champion...", autocomplete: "off", spellcheck: "false", "aria-label": "Champion name" });
  const list = el("ul", { class: "suggest", role: "listbox" });
  const form = el("div", { class: "gform" }, input, list);
  const head = el("div", { class: "grow ghead" }, el("div", { class: "gcell icon" }), ...COLS.map((c) => el("div", { class: "gcell" }, c.label)));
  const rows = el("div");
  const board = el("div", { class: "gboard" }, head, rows);
  const legend = el("p", { class: "muted small center" },
    el("i", { class: "sw correct" }), " match  ", el("i", { class: "sw present" }), " partial  ", el("i", { class: "sw absent" }), " wrong  ↑↓ release year");
  const end = el("div");
  root.append(el("p", { class: "muted center" }, "Guess the champion. Each guess shows how close you are."), form, end, board, legend);

  let active = 0;
  let matches = [];

  function suggest() {
    const q = norm(input.value);
    const used = new Set(st.guesses);
    matches = q ? POOL.filter((c) => !used.has(c.id) && norm(c.name).startsWith(q))
      .concat(POOL.filter((c) => !used.has(c.id) && !norm(c.name).startsWith(q) && norm(c.name).includes(q))).slice(0, 6) : [];
    active = 0;
    list.replaceChildren(...matches.map((c, i) => el("li", {
      class: i === active ? "on" : "", role: "option",
      onmousedown: (e) => { e.preventDefault(); pick(c); },
    }, el("img", { src: iconUrl(c.id), alt: "", loading: "lazy" }), c.name)));
  }

  function pick(c) {
    if (st.done || st.guesses.includes(c.id)) return;
    st.guesses.unshift(c.id);
    if (c.id === answer.id) st.done = true;
    input.value = "";
    suggest();
    if (!practice) {
      save(key, st);
      if (st.done) recordResult("guess", day, true);
    }
    render(true);
  }

  input.addEventListener("input", suggest);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!matches.length) return;
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
      [...list.children].forEach((li, i) => li.classList.toggle("on", i === active));
    } else if (e.key === "Enter" && matches.length) {
      e.preventDefault();
      pick(matches[active]);
    }
  });
  input.addEventListener("blur", () => setTimeout(() => list.replaceChildren(), 100));

  function row(id, fresh) {
    const g = BY_ID[id];
    const r = el("div", { class: "grow" + (fresh ? " fresh" : "") },
      el("div", { class: "gcell icon", title: g.name }, el("img", { src: iconUrl(id), alt: "" }), el("span", { class: "gname" }, g.name)));
    for (const c of COLS) {
      const { cls, arrow } = compare(g, answer, c.key);
      const v = Array.isArray(g[c.key]) ? g[c.key].join(", ") : String(g[c.key]);
      r.append(el("div", { class: "gcell " + cls }, v, arrow ? el("span", { class: "arrow" }, arrow) : null));
    }
    return r;
  }

  function render(fresh) {
    rows.replaceChildren(...st.guesses.map((id, i) => row(id, fresh && i === 0)));
    if (st.done) {
      form.remove();
      const n = st.guesses.length;
      const lines = st.guesses.slice().reverse().slice(0, 8).map((id) =>
        COLS.map((c) => ({ correct: "🟩", present: "🟧", absent: "🟥" })[compare(BY_ID[id], answer, c.key).cls]).join("")).join("\n");
      end.replaceChildren(
        el("div", { class: "reveal" }, el("img", { src: iconUrl(answer.id), alt: "" }),
          el("div", {}, el("b", {}, answer.name), el("div", { class: "muted small" }, answer.title))),
        resultPanel({
          title: n === 1 ? "First try!" : `Found in ${n} guesses`,
          mode: "guess", practice, onPractice,
          shareText: `Rift Daily Champion Guess ${practice ? "Practice" : "#" + day}: ${n} guess${n > 1 ? "es" : ""}\n${lines}${n > 8 ? "\n..." : ""}\nlol.parbs.online`,
        }));
    }
  }

  render(false);
  if (!st.done && matchMedia("(pointer: fine)").matches) input.focus();
}
