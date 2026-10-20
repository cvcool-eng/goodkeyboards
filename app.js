// Simple hash router:
//   #/                     all keyboards
//   #/category/<id>        keyboards in one category
//   #/keyboard/<id>        one keyboard with its store links

const main = document.getElementById("main");
const menuBtn = document.getElementById("categories-btn");
const menu = document.getElementById("categories-menu");
const menuList = document.getElementById("categories-list");

document.getElementById("year").textContent = new Date().getFullYear();

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const categoryById = id => CATEGORIES.find(c => c.id === id);
const keyboardsIn = id => KEYBOARDS.filter(k => k.categories.includes(id));

// ---------- Keyboard drawings ----------
// Key widths in units (1 = one normal key). Negative numbers are gaps,
// "gap" is a small space between rows.
const ones = n => Array(n).fill(1);
const ROWS_60 = [
  [...ones(13), 2],
  [1.5, ...ones(12), 1.5],
  [1.75, ...ones(11), 2.25],
  [2.25, ...ones(10), 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];
const ROWS_65 = [
  [...ones(13), 2, 1],
  [1.5, ...ones(12), 1.5, 1],
  [1.75, ...ones(11), 2.25, 1],
  [2.25, ...ones(10), 1.75, 1, 1],
  [1.25, 1.25, 1.25, 6.25, ...ones(6)],
];
const LAYOUTS = {
  "60": ROWS_60,
  "65": ROWS_65,
  "75": [[1, -0.25, ...ones(4), -0.25, ...ones(4), -0.25, ...ones(4), -0.25, 1, 1], "gap", ...ROWS_65],
  "tkl": [
    [1, -1, ...ones(4), -0.5, ...ones(4), -0.5, ...ones(4), -0.25, 1, 1, 1], "gap",
    [...ROWS_60[0], -0.25, 1, 1, 1],
    [...ROWS_60[1], -0.25, 1, 1, 1],
    ROWS_60[2],
    [...ROWS_60[3], -1.25, 1],
    [...ROWS_60[4], -0.25, 1, 1, 1],
  ],
};
const COLORS = {
  olive: "#706D54", brown: "#A08963", tan: "#C9B194",
  cream: "#E4E8D8", green: "#C9D1B5", dark: "#2B2A21",
};

function drawKeyboard(k) {
  const look = k.look || {};
  const rows = (LAYOUTS[look.layout] || ROWS_60).map(r => (r === "gap" ? r : [...r]));
  if (look.knob) rows[0][rows[0].length - 1] = "knob";
  const [body, alpha, mod, accent] = (look.colors || ["olive", "cream", "tan", "brown"]).map(c => COLORS[c] || c);
  const U = 20, PAD = 10, GAP = look.lowProfile ? 3 : 2;
  let y = PAD, width = 0, shapes = "";

  rows.forEach((row, r) => {
    if (row === "gap") { y += U * 0.25; return; }
    let x = PAD;
    row.forEach((w, i) => {
      if (typeof w === "number" && w < 0) { x -= w * U; return; }
      if (w === "knob") {
        shapes += `<circle cx="${x + U / 2}" cy="${y + U / 2}" r="${U * 0.4}" fill="${accent}"/>
          <rect x="${x + U / 2 - 1}" y="${y + 3.5}" width="2" height="5" rx="1" fill="${body}"/>`;
        x += U; return;
      }
      const isEsc = r === 0 && i === 0;
      const isEnter = row[0] === 1.75 && w === 2.25;
      const fill = isEsc || isEnter ? accent : w > 1 && w < 6 ? mod : alpha;
      const kx = x + GAP / 2, ky = y + GAP / 2, kw = w * U - GAP, kh = U - GAP;
      shapes += `<rect x="${kx}" y="${ky}" width="${kw}" height="${kh}" rx="${look.lowProfile ? 2 : 3.5}" fill="${fill}"/>`;
      if (!look.lowProfile) {
        shapes += `<rect x="${kx + 2.5}" y="${ky + 1.5}" width="${kw - 5}" height="${kh - 5}" rx="2.5" fill="#fff" opacity="0.18"/>`;
      }
      x += w * U;
    });
    width = Math.max(width, x);
    y += U;
  });

  const W = width + PAD, H = y + PAD;
  return `<svg class="kb-drawing" viewBox="0 0 ${W} ${H}" role="img" aria-label="Drawing of the ${esc(k.brand + " " + k.name)}">
    <rect x="1" y="3" width="${W - 2}" height="${H - 2}" rx="12" fill="#000" opacity="0.12"/>
    <rect width="${W}" height="${H - 2}" rx="12" fill="${body}"/>
    ${shapes}
  </svg>`;
}

// Shows the drawing, with the real photo (k.image, or images/<id>.png)
// on top of it if that file exists.
function image(k) {
  const src = k.image || `images/${k.id}.png`;
  return `${drawKeyboard(k)}<img class="photo" src="${esc(src)}" alt="${esc(k.brand + " " + k.name)}"
    loading="lazy" onerror="this.remove()">`;
}

// ---------- Categories menu ----------
function buildMenu(activeId) {
  const items = [{ id: "", name: "All Keyboards", count: KEYBOARDS.length },
    ...CATEGORIES.map(c => ({ ...c, count: keyboardsIn(c.id).length }))];
  menuList.innerHTML = items.map(c => `
    <li><a href="${c.id ? "#/category/" + c.id : "#/"}" ${c.id === activeId ? 'aria-current="page"' : ""}>
      <span>${esc(c.name)}</span><span class="count">${c.count}</span>
    </a></li>`).join("");
}

function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  if (open) menuList.querySelector("a")?.focus();
}

menuBtn.addEventListener("click", () => setMenu(menu.hidden));
document.addEventListener("click", e => {
  if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); }
});
menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });

// ---------- Views ----------
function chips(activeId) {
  return `<ul class="chips" aria-label="Categories">
    <li><a href="#/" ${!activeId ? 'aria-current="page"' : ""}>All</a></li>
    ${CATEGORIES.map(c => `<li><a href="#/category/${c.id}" ${c.id === activeId ? 'aria-current="page"' : ""}>${esc(c.name)}</a></li>`).join("")}
  </ul>`;
}

function card(k, i = 0) {
  const tags = k.categories.map(id => categoryById(id)).filter(Boolean)
    .map(c => `<span class="tag">${esc(c.name)}</span>`).join("");
  return `<li style="--i:${i}"><a class="card" href="#/keyboard/${k.id}">
    <div class="card-img">${image(k)}</div>
    <div class="card-body">
      <span class="card-brand">${esc(k.brand)}</span>
      <h2>${esc(k.name)}</h2>
      <p>${esc(k.summary)}</p>
      <div class="tags">${tags}</div>
    </div>
  </a></li>`;
}

function listView(title, intro, list, activeId) {
  document.title = activeId ? `${title} – GoodKeyboards` : "GoodKeyboards";
  main.innerHTML = `
    <section class="hero">
      <h1>${esc(title)}</h1>
      <p>${esc(intro)}</p>
    </section>
    ${chips(activeId)}
    ${list.length
      ? `<ul class="grid">${list.map(card).join("")}</ul>`
      : `<div class="empty">No keyboards in this category yet. Check back soon.</div>`}`;
}

function detailView(k) {
  document.title = `${k.brand} ${k.name} – GoodKeyboards`;
  const specs = Object.entries(k.specs || {}).map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("");
  const stores = k.stores.map(s => `
    <li><a class="store-link" href="${esc(s.url)}" target="_blank" rel="noopener">
      <span>Buy on ${esc(s.name)}</span><span aria-hidden="true">&rarr;</span>
    </a></li>`).join("");
  main.innerHTML = `
    <a class="back" href="javascript:history.back()">&larr; Back</a>
    <article class="detail">
      <div class="detail-img">${image(k)}</div>
      <div>
        <span class="card-brand">${esc(k.brand)}</span>
        <h1>${esc(k.name)}</h1>
        <p class="summary">${esc(k.summary)}</p>
        <dl class="specs">${specs}</dl>
        <div class="tags">${k.categories.map(id => categoryById(id)).filter(Boolean)
          .map(c => `<a class="tag" href="#/category/${c.id}">${esc(c.name)}</a>`).join("")}</div>
        <section class="stores">
          <h2>Where to buy</h2>
          <ul>${stores}</ul>
          <p class="small">Prices and availability change. Check the store for the current price.</p>
        </section>
      </div>
    </article>`;
}

function aboutView() {
  document.title = "About – GoodKeyboards";
  main.innerHTML = `
    <article class="about">
      <section class="hero">
        <h1>About GoodKeyboards</h1>
        <p>Helping you find the keyboard that fits you.</p>
      </section>
      <p>GoodKeyboards is a showcase of the best gaming keyboards on the market. We sort them into simple
        categories, like 60%, 65%, typing, thock, quiet and budget (under $60), so you can quickly find one
        that fits how you play and type.</p>
      <h2>How it works</h2>
      <p>Pick a category or browse all keyboards, then click a keyboard to see its details and links to stores
        that sell it, like Amazon and eBay. <strong>Disclaimer:</strong> You do not buy products on this website.
        When you click a store link, you buy directly from that store.</p>
    </article>`;
}

function route() {
  const [, type, id] = location.hash.replace(/^#\/?/, "/").split("/");
  let activeId = "";

  if (type === "category" && categoryById(id)) {
    const c = categoryById(id);
    activeId = c.id;
    listView(c.name, c.blurb, keyboardsIn(c.id), c.id);
  } else if (type === "keyboard" && KEYBOARDS.find(k => k.id === id)) {
    activeId = null;
    detailView(KEYBOARDS.find(k => k.id === id));
  } else if (type === "about") {
    activeId = null;
    aboutView();
  } else {
    listView("The keyboard that fits you",
      "We find the best keyboards on the market and display them here for you to access.", KEYBOARDS, "");
  }

  buildMenu(activeId);
  setMenu(false);
  const aboutLink = document.querySelector(".about-link");
  if (type === "about") aboutLink.setAttribute("aria-current", "page");
  else aboutLink.removeAttribute("aria-current");
  // Replay the bounce-in animation for the new page
  main.classList.remove("enter");
  void main.offsetWidth;
  main.classList.add("enter");

  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

window.addEventListener("hashchange", route);
route();
