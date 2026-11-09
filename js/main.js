import * as wordle from "./wordle.js";
import * as connections from "./connections.js";
import * as guess from "./guess.js";
import { dayNumber, el, getStats } from "./util.js";
import { openGuide } from "./guide.js";

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
    el("div", { class: "modectl" },
      el("div", { class: "seg" },
        el("a", { href: `#/${mode}`, class: practice ? "" : "on" }, `Daily #${day}`),
        el("a", { href: `#/${mode}/practice`, class: practice ? "on" : "" }, "Practice")),
      guideButton())));
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
      el("div", { class: "eyebrow" }, `// Puzzle #${day}`),
      el("h1", {}, "Rift", el("span", {}, "Daily")),
      el("p", { class: "muted" }, "Three League of Legends word puzzles, new every day."),
      guideButton()),
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

// Champion guide button, shown beside Daily/Practice and on the home page.
function guideButton() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("d", "M2 2h7v7H2zm9 0h7v7h-7zM2 11h7v7H2zm9 0h7v7h-7z");
  svg.append(path);
  return el("button", { class: "guide-btn", type: "button", onclick: openGuide, "aria-label": "Champion guide" }, svg,
    el("span", { class: "long" }, "Champion guide"), el("span", { class: "short" }, "Champions"));
}

window.addEventListener("hashchange", route);
route();
