import { DD_VERSION } from "./data.js";

// Day 1 is 2026-11-08. Uses the player's local calendar date.
const EPOCH = Date.UTC(2026, 10, 8);
export function dayNumber(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5) + 1;
}

export function msToMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

export function rng(seed) {
  // Scramble the seed first so nearby seeds (consecutive days) diverge.
  let a = seed >>> 0;
  a = Math.imul(a ^ (a >>> 16), 0x85ebca6b);
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  a = (a ^ (a >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick the item for a given day: walk a fixed shuffle of the pool so answers
// don't repeat until the whole pool has been used.
export function dailyPick(pool, day, salt) {
  const cycle = Math.floor((day - 1) / pool.length);
  const order = shuffle(pool, rng(salt * 7919 + cycle));
  return order[(((day - 1) % pool.length) + pool.length) % pool.length];
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export const iconUrl = (id) =>
  `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${id}.png`;

export const lettersOnly = (s) => s.toUpperCase().replace(/[^A-Z]/g, "");

export function load(key, fallback) {
  try {
    const v = localStorage.getItem("rd:" + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key, value) {
  try {
    localStorage.setItem("rd:" + key, JSON.stringify(value));
  } catch {}
}

// Per-mode stats: played, wins, streak, best, lastWinDay.
export function recordResult(mode, day, won) {
  const s = load("stats:" + mode, { played: 0, wins: 0, streak: 0, best: 0, lastDay: 0 });
  if (s.lastDay === day) return s;
  s.played++;
  if (won) {
    s.wins++;
    s.streak = s.lastWinDay === day - 1 ? s.streak + 1 : 1;
    s.lastWinDay = day;
    s.best = Math.max(s.best, s.streak);
  } else s.streak = 0;
  s.lastDay = day;
  save("stats:" + mode, s);
  return s;
}
export const getStats = (mode) =>
  load("stats:" + mode, { played: 0, wins: 0, streak: 0, best: 0, lastDay: 0 });

let toastTimer;
export function toast(msg, ms = 1800) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

export async function share(text) {
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  } catch {
    prompt("Copy your result:", text);
  }
}

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k);
  return e;
}

// Result panel shown when a game ends.
export function resultPanel({ title, sub, mode, shareText, onPractice, practice }) {
  const s = getStats(mode);
  const panel = el("div", { class: "result" },
    el("h3", {}, title),
    sub ? el("p", { class: "muted" }, sub) : null,
    practice ? null : el("div", { class: "stats" },
      stat(s.played, "Played"),
      stat(s.played ? Math.round((100 * s.wins) / s.played) : 0, "Win %"),
      stat(s.streak, "Streak"),
      stat(s.best, "Best")),
    el("div", { class: "row" },
      el("button", { class: "btn primary", onclick: () => share(shareText) }, "Share"),
      el("button", { class: "btn", onclick: onPractice }, practice ? "Another one" : "Practice")),
    practice ? null : countdown());
  return panel;
}

function stat(n, label) {
  return el("div", { class: "stat" }, el("b", {}, String(n)), el("span", {}, label));
}

function countdown() {
  const span = el("span");
  const tick = () => {
    const ms = msToMidnight();
    const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
    span.textContent = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    if (span.isConnected || !span.dataset.started) {
      span.dataset.started = 1;
      setTimeout(tick, 1000);
    }
  };
  tick();
  return el("p", { class: "muted small" }, "Next daily in ", span);
}
