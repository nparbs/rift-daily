import * as wordle from "./wordle.js";
import * as connections from "./connections.js";
import * as guess from "./guess.js";
import { dayNumber, el, getStats } from "./util.js";

const MODES = {
  wordle: { name: "Wordle", mod: wordle, blurb: "Spell the champion's name in six tries.", glyph: "W" },
  connections: { name: "Connections", mod: connections, blurb: "Sort 16 champions into four hidden groups.", glyph: "C" },
  guess: { name: "Champion Guess", mod: guess, blurb: "Close in using role, region, species and more.", glyph: "?" },
};

const main = document.getElementById("main");
const nav = document.getElementById("nav");
let cleanup = null;

function route() {
  if (cleanup) cleanup();
  cleanup = null;
  const [, mode, sub] = location.hash.split("/");
  const practice = sub === "practice";
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.mode === (mode || "")));
  main.replaceChildren();
  window.scrollTo(0, 0);

  const m = MODES[mode];
  if (!m) return home();
  document.title = `${m.name} · Rift Daily`;
  const day = dayNumber();
  main.append(el("div", { class: "modebar" },
    el("h2", {}, m.name),
    el("div", { class: "seg" },
      el("a", { href: `#/${mode}`, class: practice ? "" : "on" }, `Daily #${day}`),
      el("a", { href: `#/${mode}/practice`, class: practice ? "on" : "" }, "Practice"))));
  const root = el("section", { class: "game " + mode });
  main.append(root);
  const onPractice = () => {
    if (practice) route();
    else location.hash = `#/${mode}/practice`;
  };
  cleanup = m.mod.mount(root, { practice, onPractice }) || null;
}

function home() {
  document.title = "Rift Daily";
  const day = dayNumber();
  main.append(
    el("div", { class: "hero" },
      el("h1", {}, "Rift Daily"),
      el("p", { class: "muted" }, `Three League of Legends word puzzles, new every day. Puzzle #${day}.`)),
    el("div", { class: "cards" }, ...Object.entries(MODES).map(([key, m]) => {
      const s = getStats(key);
      const done = s.lastDay === day;
      return el("a", { class: "card", href: `#/${key}` },
        el("div", { class: "glyph" }, m.glyph),
        el("div", {},
          el("h3", {}, m.name, done ? el("span", { class: "badge" }, "Done") : null),
          el("p", { class: "muted" }, m.blurb),
          s.streak ? el("p", { class: "small" }, `Streak: ${s.streak}`) : null));
    })),
    el("p", { class: "muted small center" }, "Each puzzle also has a practice mode for unlimited play."));
}

window.addEventListener("hashchange", route);
route();
