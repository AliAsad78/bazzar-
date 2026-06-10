// products.js — seeds Firestore once, then renders all product grids live from DB
import { db } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, query, where, orderBy, limit, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Seed data (only written once, if collection is empty) ──────────────────
const SEED_PRODUCTS = [
  // Flash Sale / Featured
  { id:"iphone-15-pro",  name:"Apple iPhone 15 Pro 256GB Natural Titanium", category:"electronics", emoji:"📱", price:329999, oldPrice:389999, discount:15, rating:4.8, reviews:2100, badge:"sale",  section:"flash", createdAt: Timestamp.now() },
  { id:"samsung-s24",    name:"Samsung Galaxy S24 Ultra 12GB/256GB Phantom Black", category:"electronics", emoji:"📲", price:189999, oldPrice:219999, discount:14, rating:4.7, reviews:1800, badge:"hot",   section:"flash", createdAt: Timestamp.now() },
  { id:"hp-pavilion",    name:"HP Pavilion 15 Core i5 12th Gen 8GB 512GB SSD", category:"electronics", emoji:"💻", price:89999,  oldPrice:105000, discount:14, rating:4.4, reviews:430,  badge:"new",   section:"flash", createdAt: Timestamp.now() },
  { id:"nike-air-max",   name:"Nike Air Max 270 React Triple White Men's", category:"fashion",     emoji:"👟", price:24999,  oldPrice:35999,  discount:30, rating:4.9, reviews:920,  badge:"sale",  section:"flash", createdAt: Timestamp.now() },
  { id:"sony-xm5",       name:"Sony WH-1000XM5 Wireless Noise Cancelling Headphones", category:"electronics", emoji:"🎧", price:49999,  oldPrice:65000,  discount:23, rating:4.8, reviews:1500, badge:"hot",   section:"flash", createdAt: Timestamp.now() },
  // Recommendations
  { id:"dyson-v15",      name:"Dyson V15 Detect Absolute Cordless Vacuum Cleaner", category:"home",        emoji:"🌀", price:85000,  oldPrice:99000,  discount:14, rating:4.9, reviews:340,  badge:"hot",   section:"reco",  createdAt: Timestamp.now() },
  { id:"casio-gshock",   name:"Casio G-Shock GA-2100 CasiOak Black & Gold",        category:"fashion",     emoji:"⌚", price:18500,  oldPrice:23000,  discount:20, rating:4.7, reviews:670,  badge:"sale",  section:"reco",  createdAt: Timestamp.now() },
  { id:"instant-pot",    name:"Instant Pot Duo 7-in-1 Electric Pressure Cooker 6L", category:"home",        emoji:"🍲", price:22000,  oldPrice:22000,  discount:0,  rating:4.6, reviews:220,  badge:"new",   section:"reco",  createdAt: Timestamp.now() },
  { id:"levis-511",      name:"Levi's 511 Slim Fit Jeans Dark Indigo Stonewash",    category:"fashion",     emoji:"👖", price:8999,   oldPrice:11999,  discount:25, rating:4.8, reviews:890,  badge:"sale",  section:"reco",  createdAt: Timestamp.now() },
  { id:"gopro-hero12",   name:"GoPro HERO12 Black Action Camera 5.3K60",            category:"electronics", emoji:"📷", price:95000,  oldPrice:115000, discount:17, rating:4.9, reviews:987,  badge:"hot",   section:"reco",  createdAt: Timestamp.now() },
];

const SEED_LISTINGS = [
  { id:"toyota-corolla", name:"Toyota Corolla Altis 1.8 2021 — Only 35k km", category:"vehicles", location:"lahore",    price:3200000, emoji:"🚗", seller:"AutoDeals PK",   createdAt: Timestamp.now() },
  { id:"gulberg-flat",   name:"2-Bed Apartment Gulberg III — Ready to Move",  category:"property", location:"lahore",    price:25000000, emoji:"🏢", seller:"Prime Realty",   createdAt: Timestamp.now() },
  { id:"macbook-pro",    name:"MacBook Pro M2 14\" 16GB/512GB — Like New",   category:"electronics", location:"karachi", price:180000,  emoji:"💻", seller:"TechResale PK",  createdAt: Timestamp.now() },
  { id:"ipad-air5",      name:"iPad Air 5th Gen 256GB WiFi Space Grey",       category:"electronics", location:"islamabad",price:75000,  emoji:"📱", seller:"GadgetHub ISB",  createdAt: Timestamp.now() },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function starsHtml(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5-full);
}
function reviewsLabel(n) {
  return n >= 1000 ? (n/1000).toFixed(1)+"k" : n;
}

// ── Render helpers ───────────────────────────────────────────────────────────
function productCardHtml(p) {
  const badgeClass = p.badge === "hot" ? "badge-hot" : p.badge === "new" ? "badge-new" : "badge-sale";
  const badgeLabel = p.badge === "hot" ? "HOT" : p.badge === "new" ? "NEW" : `-${p.discount}%`;
  const oldPriceHtml = p.oldPrice > p.price
    ? `<span class="price-old">${formatPrice(p.oldPrice)}</span><span class="price-off">-${p.discount}%</span>`
    : "";
  return `
    <div class="product-card" data-category="${p.category}" data-price="${p.price}" data-rating="${p.rating}" data-discount="${p.discount}" onclick="goToProduct('${p.id}')">
      <div class="pc-img">${p.emoji}
        <span class="pc-badge ${badgeClass}">${badgeLabel}</span>
        <button class="pc-wish" data-id="${p.id}" onclick="event.stopPropagation();toggleWishlist(this)">♡</button>
      </div>
      <div class="pc-info">
        <div class="pc-name">${p.name}</div>
        <div class="pc-price">
          <span class="price-now">${formatPrice(p.price)}</span>
          ${oldPriceHtml}
        </div>
        <div class="pc-rating"><span class="stars">${starsHtml(p.rating)}</span> ${p.rating} (${reviewsLabel(p.reviews)})</div>
      </div>
      <button class="add-cart" onclick="event.stopPropagation();addToCart('${p.name}','${formatPrice(p.price)}','${p.emoji}')">🛒 Add to Cart</button>
    </div>`;
}

function listingCardHtml(l) {
  const ago = "Just now";
  return `
    <div class="listing-card" data-category="${l.category}" data-location="${l.location}" data-price="${l.price}" onclick="goToProduct('${l.id}')">
      <div class="lc-img">${l.emoji}</div>
      <div class="lc-info">
        <div class="lc-title">${l.name}</div>
        <div class="lc-price">${formatPrice(l.price)}</div>
        <div class="lc-meta">📍 ${l.location.charAt(0).toUpperCase()+l.location.slice(1)} &nbsp;·&nbsp; ${ago}</div>
        <div class="lc-seller">🏪 ${l.seller}</div>
      </div>
    </div>`;
}

function skeletonHtml(n) {
  return Array(n).fill(`<div class="product-card" style="opacity:.35;pointer-events:none">
    <div class="pc-img" style="background:var(--gray-light)"></div>
    <div class="pc-info"><div class="pc-name" style="background:var(--gray-light);height:14px;border-radius:4px;margin-bottom:6px"></div>
    <div class="pc-price" style="background:var(--gray-light);height:12px;border-radius:4px;width:60%"></div></div>
  </div>`).join("");
}

// ── Seed if empty ────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  const snap = await getDocs(query(collection(db, "products"), limit(1)));
  if (!snap.empty) return; // already seeded
  const batch = [...SEED_PRODUCTS.map(p => ({col:"products", data:p})),
                  ...SEED_LISTINGS.map(l => ({col:"listings", data:l}))];
  for (const {col, data} of batch) {
    await addDoc(collection(db, col), data);
  }
  console.log("[Bazaar] Firestore seeded with", SEED_PRODUCTS.length, "products and", SEED_LISTINGS.length, "listings.");
}

// ── Load & render ─────────────────────────────────────────────────────────────
async function loadGrid(gridId, colName, section, renderFn) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = skeletonHtml(4);
  try {
    let q;
    if (section) {
      q = query(collection(db, colName), where("section", "==", section));
    } else {
      q = query(collection(db, colName), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    if (snap.empty) { grid.innerHTML = "<p style='padding:16px;color:#888'>No items yet.</p>"; return; }
    grid.innerHTML = snap.docs.map(d => renderFn({...d.data(), _docId: d.id})).join("");
    // Re-run filter/sort state for this grid (in case chips were already clicked)
    if (typeof renderGrid === "function") renderGrid(gridId);
  } catch(e) {
    console.error("[Bazaar] Firestore load error:", e);
    grid.innerHTML = "<p style='padding:16px;color:#888'>Could not load products. Check Firestore rules.</p>";
  }
}

async function init() {
  await seedIfEmpty();
  loadGrid("flashGrid",      "products", "flash",  productCardHtml);
  loadGrid("recoGrid",       "products", "reco",   productCardHtml);
  loadGrid("classifiedGrid", "listings", null,     listingCardHtml);
}

init();
