// Champion guide: an overlay listing every champion with their portrait.
import { CHAMPS } from "./data.js";
import { el, iconUrl } from "./util.js";

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
let dialog;

function build() {
  const search = el("input", { type: "search", placeholder: "Search champions...", autocomplete: "off", spellcheck: "false", "aria-label": "Search champions" });
  const count = el("span", { class: "muted small" });
  const tiles = CHAMPS.map((c) => {
    const t = el("div", { class: "gtile", title: `${c.name}, ${c.title}` },
      el("img", { src: iconUrl(c.id), alt: "", loading: "lazy", width: 64, height: 64 }),
      el("span", {}, c.name));
    t.dataset.key = norm(c.name);
    return t;
  });
  const grid = el("div", { class: "guide-grid" }, tiles);
  const empty = el("p", { class: "muted center", hidden: true }, "No champion matches that.");

  const filter = () => {
    const q = norm(search.value);
    let n = 0;
    for (const t of tiles) {
      const show = !q || t.dataset.key.includes(q);
      t.hidden = !show;
      if (show) n++;
    }
    count.textContent = `${n} of ${CHAMPS.length}`;
    empty.hidden = n > 0;
  };
  search.addEventListener("input", filter);
  // In a search box Chrome's first Escape only clears the text; close straight away instead.
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dialog.close();
    }
  });
  filter();

  dialog = el("dialog", { class: "guide", "aria-label": "Champion guide" },
    el("div", { class: "guide-panel" },
      el("div", { class: "guide-head" },
        el("h2", {}, "Champions"),
        count,
        el("button", { class: "guide-close", "aria-label": "Close", onclick: () => dialog.close() }, "✕")),
      search, grid, empty));
  // The dialog box itself has no padding, so a click that lands on it (not the panel) is the backdrop.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    search.value = "";
    filter();
  });
  document.body.append(dialog);
  return search;
}

let searchBox;
export function openGuide() {
  if (!dialog) searchBox = build();
  dialog.showModal();
  dialog.querySelector(".guide-grid").scrollTop = 0;
  if (matchMedia("(pointer: fine)").matches) searchBox.focus();
  else dialog.querySelector(".guide-close").focus();
}
