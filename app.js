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
// Full size = TKL plus a number pad on the right
LAYOUTS.full = [
  LAYOUTS.tkl[0], "gap",
  [...LAYOUTS.tkl[2], -0.25, 1, 1, 1, 1],
  [...LAYOUTS.tkl[3], -0.25, 1, 1, 1, 1],
  [...ROWS_60[2], -3.5, 1, 1, 1, 1],
  [...LAYOUTS.tkl[5], -1.25, 1, 1, 1, 1],
  [...LAYOUTS.tkl[6], -0.25, 2, 1, 1],
];
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

// ---------- UI sounds ----------
// Made in code with the Web Audio API, so there are no sound files.
let audio = null;
let soundOn = true;
try { soundOn = localStorage.getItem("gk-sound") !== "off"; } catch (e) {}

function audioCtx() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

// Key sound profiles. Each sound = a short "body" tone + a filtered click.
//   tone:  [wave, start Hz, end Hz, loudness, length in seconds]
//   click: [filter, Hz, loudness, length in seconds]
//   repeat: extra clicks (the double click of clicky "blue" switches)
const KEY_SOUNDS = {
  thock:  { volume: 0.2,  tone: ["sine", 190, 70, 0.9, 0.1],        click: ["lowpass", 1600, 0.5, 0.03] },
  creamy: { volume: 0.18, tone: ["sine", 330, 140, 0.6, 0.07],      click: ["lowpass", 2600, 0.6, 0.025] },
  clack:  { volume: 0.16, tone: ["triangle", 1400, 600, 0.35, 0.04], click: ["bandpass", 3800, 1.2, 0.02] },
  clicky: { volume: 0.14, tone: ["triangle", 2200, 1200, 0.25, 0.025], click: ["highpass", 4500, 1.1, 0.012], repeat: 1 },
  quiet:  { volume: 0.09, tone: ["sine", 240, 110, 0.4, 0.05],      click: ["lowpass", 900, 0.3, 0.02] },
};

function playKey(name = "clack") {
  if (!soundOn) return;
  const p = KEY_SOUNDS[name] || KEY_SOUNDS.clack;
  const a = audioCtx(), t = a.currentTime;
  const out = a.createGain();
  out.gain.value = p.volume;
  out.connect(a.destination);

  const [wave, from, to, toneGain, toneLen] = p.tone;
  const body = a.createOscillator(), bodyGain = a.createGain();
  body.type = wave;
  body.frequency.setValueAtTime(from, t);
  body.frequency.exponentialRampToValueAtTime(to, t + toneLen * 0.8);
  bodyGain.gain.setValueAtTime(toneGain, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + toneLen);
  body.connect(bodyGain).connect(out);
  body.start(t);
  body.stop(t + toneLen + 0.02);

  const [filterType, freq, clickGain, clickLen] = p.click;
  for (let n = 0; n <= (p.repeat || 0); n++) {
    const len = Math.floor(a.sampleRate * clickLen);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 4;
    const click = a.createBufferSource(), filter = a.createBiquadFilter(), gain = a.createGain();
    click.buffer = buf;
    filter.type = filterType;
    filter.frequency.value = freq;
    gain.gain.value = clickGain;
    click.connect(filter).connect(gain).connect(out);
    click.start(t + n * 0.014);
  }
}

// The keyboard a click belongs to: the card clicked, or the keyboard page you're on
function soundFor(el) {
  const card = el.closest(".card");
  const id = card ? card.getAttribute("href").split("/").pop()
                  : (location.hash.match(/^#\/keyboard\/([^/]+)/) || [])[1];
  const k = id && KEYBOARDS.find(k => k.id === id);
  return (k && k.sound) || "clack";
}

// A short "pop" that rises when opening and falls when closing
function playPop(up = true) {
  if (!soundOn) return;
  const a = audioCtx(), t = a.currentTime;
  const osc = a.createOscillator(), gain = a.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(up ? 380 : 620, t);
  osc.frequency.exponentialRampToValueAtTime(up ? 620 : 380, t + 0.09);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.13);
}

document.addEventListener("click", e => {
  const el = e.target.closest(".card, .chips a, .store-link, .categories-menu a, .tag, .back, .about-link, .brand, .detail-img");
  if (el) playKey(soundFor(el));
});

const soundBtn = document.getElementById("sound-btn");
function updateSoundBtn() {
  soundBtn.setAttribute("aria-pressed", String(soundOn));
  soundBtn.title = soundOn ? "Sounds on (click to mute)" : "Sounds off (click to turn on)";
  soundBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/>
    ${soundOn ? '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'
              : '<path d="m16 9 6 6"/><path d="m22 9-6 6"/>'}
  </svg>`;
}
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  try { localStorage.setItem("gk-sound", soundOn ? "on" : "off"); } catch (e) {}
  updateSoundBtn();
  playPop(true);
});
updateSoundBtn();

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

menuBtn.addEventListener("click", () => {
  const opening = menu.hidden;
  setMenu(opening);
  playPop(opening);
});
document.addEventListener("click", e => {
  if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
});
// The list page (all keyboards or a category) to return to from a keyboard page
let lastListHash = "#/";

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!menu.hidden) { setMenu(false); menuBtn.focus(); return; }
  // Esc on a keyboard page goes back to the list you came from
  if (location.hash.startsWith("#/keyboard/")) {
    playKey(soundFor(document.body));
    location.hash = lastListHash;
  }
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

// A specific video if the keyboard has one, otherwise YouTube search results for its reviews
function youtubeLink(k) {
  return k.youtube || "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${k.brand} ${k.name} review`);
}

function detailView(k) {
  document.title = `${k.brand} ${k.name} – GoodKeyboards`;
  const specs = Object.entries(k.specs || {}).map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("");
  const stores = k.stores.map(s => `
    <li><a class="store-link" href="${esc(s.url)}" target="_blank" rel="noopener">
      <span>Buy on ${esc(s.name)}</span><span aria-hidden="true">&rarr;</span>
    </a></li>`).join("");
  main.innerHTML = `
    <a class="back" href="${lastListHash}">&larr; Back</a>
    <article class="detail">
      <div>
        <div class="detail-img" title="Tap to hear how it sounds">${image(k)}</div>
        <p class="small hear">Tap the keyboard to hear how it sounds.</p>
      </div>
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
          <a class="store-link youtube-link" href="${esc(youtubeLink(k))}" target="_blank" rel="noopener">
            <span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            YouTube review</span><span aria-hidden="true">&rarr;</span>
          </a>
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
  if (type !== "keyboard" && type !== "about") lastListHash = location.hash || "#/";

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
