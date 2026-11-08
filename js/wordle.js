import { CHAMPS } from "./data.js";
import { dailyPick, dayNumber, el, iconUrl, lettersOnly, load, randomSeed, recordResult, resultPanel, rng, save, toast } from "./util.js";

const TRIES = 6;
export const POOL = CHAMPS.filter((c) => {
  const n = lettersOnly(c.name).length;
  return n >= 4 && n <= 9;
});

function score(guess, answer) {
  const res = Array(guess.length).fill("absent");
  const left = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) res[i] = "correct";
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (res[i] !== "correct" && left[guess[i]]) {
      res[i] = "present";
      left[guess[i]]--;
    }
  }
  return res;
}

export function mount(root, { practice, onPractice }) {
  const day = dayNumber();
  const seed = practice ? randomSeed() : null;
  const champ = practice ? POOL[Math.floor(rng(seed)() * POOL.length)] : dailyPick(POOL, day, 1);
  const answer = lettersOnly(champ.name);
  const N = answer.length;
  const key = "wordle:" + day;
  let st = practice ? null : load(key, null);
  if (!st || st.answer !== answer) st = { answer, guesses: [], done: false, won: false };
  let cur = "";

  const board = el("div", { class: "wboard" });
  board.style.setProperty("--n", N); // CSSOM, not a style attribute, so the CSP allows it
  const kb = el("div", { class: "kb" });
  const end = el("div");
  root.append(
    el("p", { class: "muted center" }, `Guess the champion. ${N} letters, ${TRIES} tries. Spaces and punctuation are left out.`),
    board, end, kb);

  const keyState = {};
  const rank = { absent: 1, present: 2, correct: 3 };

  function render() {
    board.replaceChildren();
    for (let r = 0; r < TRIES; r++) {
      const g = st.guesses[r];
      const row = el("div", { class: "wrow" });
      const marks = g ? score(g, answer) : null;
      const text = g ?? (r === st.guesses.length && !st.done ? cur : "");
      for (let i = 0; i < N; i++) {
        const ch = text[i] || "";
        row.append(el("div", { class: `wtile ${marks ? marks[i] : ch ? "filled" : ""}` }, ch));
      }
      board.append(row);
    }
    for (const g of st.guesses) {
      score(g, answer).forEach((m, i) => {
        const k = g[i];
        if (!keyState[k] || rank[m] > rank[keyState[k]]) keyState[k] = m;
      });
    }
    kb.querySelectorAll("button[data-k]").forEach((b) => {
      b.className = "key " + (keyState[b.dataset.k] || "");
    });
    if (st.done) showEnd();
  }

  function showEnd() {
    kb.remove();
    const rows = st.guesses.map((g) =>
      score(g, answer).map((m) => ({ correct: "🟩", present: "🟨", absent: "⬛" })[m]).join("")).join("\n");
    const tag = practice ? "Practice" : `#${day}`;
    end.replaceChildren(
      el("div", { class: "reveal" },
        el("img", { src: iconUrl(champ.id), alt: "" }),
        el("div", {}, el("b", {}, champ.name), el("div", { class: "muted small" }, champ.title))),
      resultPanel({
        title: st.won ? `Got it in ${st.guesses.length}!` : "Out of tries",
        mode: "wordle", practice, onPractice,
        shareText: `Rift Daily Wordle ${tag} ${st.won ? st.guesses.length : "X"}/${TRIES}\n${rows}\nlol.parbs.online`,
      }));
  }

  function submit() {
    if (cur.length !== N) return toast(`Needs ${N} letters`);
    st.guesses.push(cur);
    cur = "";
    if (st.guesses.at(-1) === answer) st.won = st.done = true;
    else if (st.guesses.length >= TRIES) st.done = true;
    if (!practice) {
      save(key, st);
      if (st.done) recordResult("wordle", day, st.won);
    }
    render();
  }

  function press(k) {
    if (st.done) return;
    if (k === "ENTER") return submit();
    if (k === "BACK") cur = cur.slice(0, -1);
    else if (/^[A-Z]$/.test(k) && cur.length < N) cur += k;
    render();
  }

  for (const line of ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"]) {
    const row = el("div", { class: "kbrow" });
    for (const k of line) {
      if (k === "+") row.append(el("button", { class: "key wide", onclick: () => press("ENTER") }, "Enter"));
      else if (k === "-") row.append(el("button", { class: "key wide", onclick: () => press("BACK"), "aria-label": "Backspace" }, "⌫"));
      else row.append(el("button", { class: "key", "data-k": k, onclick: () => press(k) }, k));
    }
    kb.append(row);
  }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Don't type into the board while the champion guide (or any text box) has focus.
    if (document.querySelector("dialog[open]") || e.target.closest?.("input, textarea")) return;
    if (e.key === "Enter") press("ENTER");
    else if (e.key === "Backspace") press("BACK");
    else if (/^[a-z]$/i.test(e.key)) press(e.key.toUpperCase());
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);
  render();
  return () => document.removeEventListener("keydown", onKey);
}
