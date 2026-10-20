// ======================================================================
// EDIT THIS FILE to add, remove or change keyboards.
//
// Each keyboard:
//   id          short unique name used in the web address (no spaces)
//   name, brand
//   image       leave "" and just save a photo as images/<id>.png
//               (e.g. images/keychron-q2.png). No photo = drawing.
//   look        how the drawing looks:
//                 layout  "60", "65", "75" or "tkl"
//                 knob    true to draw a volume knob
//                 lowProfile  true for flat, thin keys
//                 colors  [case, letter keys, other keys, Esc/Enter]
//                         using olive, brown, tan, cream, green, dark
//   categories  any of the category ids listed in CATEGORIES below
//   summary     one or two sentences
//   specs       anything you want listed
//   stores      where to buy (store search links)
//
// The sample keyboards below are EXAMPLES. Check the details against
// the manufacturer's page before you publish.
// ======================================================================

const CATEGORIES = [
  { id: "60",     name: "60% Keyboards",    blurb: "Compact boards with no arrow keys or function row. Maximum mouse space." },
  { id: "65",     name: "65% Keyboards",    blurb: "Compact boards that keep the arrow keys." },
  { id: "typing", name: "Typing Keyboards", blurb: "Comfortable, consistent boards for long typing sessions." },
  { id: "thock",  name: "Thock Keyboards",  blurb: "Deep, satisfying sound profiles." },
  { id: "quiet",  name: "Quiet Keyboards",  blurb: "These won't wake up your parents at 4 am in the morning." },
  // Rule: only keyboards that usually sell for under $60 (US).
  { id: "budget", name: "Budget Keyboards", blurb: "Great keyboards under $60." },
];

// Builds search links for a product on each store.
function searchLinks(query) {
  const q = encodeURIComponent(query);
  return [
    { name: "Amazon",   url: "https://www.amazon.com/s?k=" + q },
    { name: "eBay",     url: "https://www.ebay.com/sch/i.html?_nkw=" + q },
    { name: "Best Buy", url: "https://www.bestbuy.com/site/searchpage.jsp?st=" + q },
    { name: "Newegg",   url: "https://www.newegg.com/p/pl?d=" + q },
  ];
}

const KEYBOARDS = [
  {
    id: "aula-f75",
    name: "F75",
    brand: "AULA",
    image: "",
    look: { layout: "75", knob: true, colors: ["olive", "cream", "tan", "brown"] },
    categories: ["thock", "typing"],
    summary: "A gasket-mounted 75% board known for its deep sound at a low price.",
    specs: { Layout: "75%", Connection: "Wired / 2.4 GHz / Bluetooth", Mount: "Gasket" },
    stores: searchLinks("AULA F75 keyboard"),
  },
  {
    id: "royal-kludge-rk61",
    name: "RK61",
    brand: "Royal Kludge",
    image: "",
    look: { layout: "60", colors: ["tan", "cream", "brown", "olive"] },
    categories: ["60", "budget"],
    summary: "A popular budget 60% wireless keyboard.",
    specs: { Layout: "60%", Connection: "Wired / Bluetooth" },
    stores: searchLinks("Royal Kludge RK61"),
  },
  {
    id: "wooting-60he",
    name: "60HE",
    brand: "Wooting",
    image: "",
    look: { layout: "60", colors: ["dark", "olive", "brown", "tan"] },
    categories: ["60"],
    summary: "A 60% board with analog Hall effect switches and adjustable actuation, built for competitive play.",
    specs: { Layout: "60%", Switches: "Hall effect (magnetic)", Connection: "Wired" },
    stores: [{ name: "Wooting (official)", url: "https://wooting.io" }, ...searchLinks("Wooting 60HE")],
  },
  {
    id: "keychron-q2",
    name: "Q2",
    brand: "Keychron",
    image: "",
    look: { layout: "65", knob: true, colors: ["brown", "cream", "olive", "tan"] },
    categories: ["65", "thock", "typing"],
    summary: "A heavy aluminum 65% board with a gasket mount and QMK/VIA support.",
    specs: { Layout: "65%", Case: "Aluminum", Mount: "Gasket" },
    stores: searchLinks("Keychron Q2"),
  },
  {
    id: "keychron-k6",
    name: "K6",
    brand: "Keychron",
    image: "",
    look: { layout: "65", colors: ["dark", "tan", "brown", "cream"] },
    categories: ["65", "typing"],
    summary: "An affordable 65% wireless board that works with Mac and Windows.",
    specs: { Layout: "65%", Connection: "Wired / Bluetooth" },
    stores: searchLinks("Keychron K6"),
  },
  {
    id: "hyperx-alloy-origins-65",
    name: "Alloy Origins 65",
    brand: "HyperX",
    image: "",
    look: { layout: "65", colors: ["olive", "tan", "brown", "cream"] },
    categories: ["65"],
    summary: "A compact 65% gaming board with an aluminum top plate.",
    specs: { Layout: "65%", Connection: "Wired" },
    stores: searchLinks("HyperX Alloy Origins 65"),
  },
  {
    id: "razer-deathstalker-v2-pro-tkl",
    name: "DeathStalker V2 Pro TKL",
    brand: "Razer",
    image: "",
    look: { layout: "tkl", lowProfile: true, colors: ["dark", "olive", "olive", "tan"] },
    categories: ["quiet"],
    summary: "A low-profile wireless board with linear optical switches and built-in dampening, quieter than typical full-height mechanicals.",
    specs: { Layout: "TKL", Profile: "Low-profile", Connection: "Wired / 2.4 GHz / Bluetooth" },
    stores: searchLinks("Razer DeathStalker V2 Pro TKL"),
  },
  {
    id: "redragon-k552",
    name: "K552 Kumara",
    brand: "Redragon",
    image: "",
    look: { layout: "tkl", colors: ["brown", "tan", "olive", "cream"] },
    categories: ["budget"],
    summary: "One of the most popular entry-level mechanical gaming keyboards.",
    specs: { Layout: "TKL", Connection: "Wired" },
    stores: searchLinks("Redragon K552"),
  },
  {
    id: "steelseries-apex-3-tkl",
    name: "Apex 3 TKL",
    brand: "SteelSeries",
    image: "",
    look: { layout: "tkl", colors: ["dark", "tan", "olive", "brown"] },
    categories: ["quiet", "budget"],
    summary: "An affordable tenkeyless board with SteelSeries' whisper-quiet switches and water and dust resistance.",
    specs: { Layout: "TKL", Switches: "Whisper-quiet (membrane)", Connection: "Wired", Extras: "IP32 water & dust resistant" },
    stores: searchLinks("SteelSeries Apex 3 TKL"),
  },
  {
    id: "steelseries-apex-pro-mini",
    name: "Apex Pro Mini",
    brand: "SteelSeries",
    image: "",
    look: { layout: "60", colors: ["olive", "dark", "brown", "tan"] },
    categories: ["60"],
    summary: "A 60% board with magnetic OmniPoint switches you can set to trigger as lightly or deeply as you want.",
    specs: { Layout: "60%", Switches: "OmniPoint 2.0 adjustable (magnetic)", Keycaps: "PBT" },
    stores: searchLinks("SteelSeries Apex Pro Mini"),
  },
  {
    id: "corsair-k65-rgb-mini",
    name: "K65 RGB Mini",
    brand: "Corsair",
    image: "",
    look: { layout: "60", colors: ["cream", "tan", "brown", "olive"] },
    categories: ["60"],
    summary: "A compact 60% gaming board with Cherry MX switches and per-key RGB lighting.",
    specs: { Layout: "60%", Switches: "Cherry MX (several options)", Connection: "Wired (USB-C)" },
    stores: searchLinks("Corsair K65 RGB Mini"),
  },
  {
    id: "corsair-k65-plus-wireless",
    name: "K65 Plus Wireless",
    brand: "Corsair",
    image: "",
    look: { layout: "75", colors: ["brown", "cream", "tan", "olive"] },
    categories: ["quiet", "typing"],
    summary: "A 75% wireless board with two layers of sound dampening and smooth linear switches.",
    specs: { Layout: "75%", Switches: "MLX Red linear, hot-swappable", Connection: "Wired / 2.4 GHz / Bluetooth" },
    stores: searchLinks("Corsair K65 Plus Wireless"),
  },
  {
    id: "razer-blackwidow-v3-mini",
    name: "BlackWidow V3 Mini HyperSpeed",
    brand: "Razer",
    image: "",
    look: { layout: "65", colors: ["dark", "brown", "olive", "tan"] },
    categories: ["65"],
    summary: "A wireless 65% board that keeps the arrow keys, with up to 200 hours of battery life.",
    specs: { Layout: "65%", Connection: "Wired / 2.4 GHz / Bluetooth", Battery: "Up to 200 hours" },
    stores: searchLinks("Razer BlackWidow V3 Mini HyperSpeed"),
  },
  {
    id: "logitech-g-pro-x-60",
    name: "G Pro X 60",
    brand: "Logitech",
    image: "",
    look: { layout: "60", colors: ["tan", "olive", "brown", "cream"] },
    categories: ["60"],
    summary: "Logitech's wireless 60% board built for esports players.",
    specs: { Layout: "60%", Connection: "Wired / Lightspeed wireless / Bluetooth" },
    stores: searchLinks("Logitech G Pro X 60"),
  },
];
