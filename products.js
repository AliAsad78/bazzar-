// products.js — seeds Firestore once per version, then renders all product grids live from DB
import { db } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, deleteDoc, setDoc, doc,
  query, where, orderBy, limit, Timestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Seed version — bump this string to force a re-seed with new data ─────────
const SEED_VERSION = "v3-real-2024";

// ── Image map — real product photos keyed by product ID ─────────────────────
const PRODUCT_IMAGES = {
  // Electronics
  'iphone-15-pro':       'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop&auto=format',
  'iphone-14':           'https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1?w=400&h=400&fit=crop&auto=format',
  'samsung-s24-ultra':   'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop&auto=format',
  'samsung-a55':         'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop&auto=format',
  'xiaomi-13t':          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format',
  'realme-12-pro':       'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop&auto=format',
  'hp-pavilion':         'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&auto=format',
  'dell-inspiron':       'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop&auto=format',
  'lenovo-ideapad':      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop&auto=format',
  'macbook-air-m2':      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop&auto=format',
  'sony-xm5':            'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop&auto=format',
  'jbl-tune-760':        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format',
  'samsung-buds2-pro':   'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?w=400&h=400&fit=crop&auto=format',
  'lg-oled-55':          'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400&h=400&fit=crop&auto=format',
  'haier-55k7500':       'https://images.unsplash.com/photo-1571415060716-baff5f717d9c?w=400&h=400&fit=crop&auto=format',
  'gopro-hero12':        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop&auto=format',
  'canon-eos-r50':       'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop&auto=format',
  'ps5-slim':            'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=400&fit=crop&auto=format',

  // Fashion
  'nike-air-max-270':    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format',
  'adidas-ultraboost':   'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop&auto=format',
  'nike-hoodie-grey':    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop&auto=format',
  'levis-511-slim':      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&auto=format',
  'casio-gshock':        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format',
  'fossil-gen6':         'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=400&fit=crop&auto=format',
  'puma-rs-x':           'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop&auto=format',
  'khaadi-kurta':        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop&auto=format',

  // Home & Kitchen
  'dyson-v15':           'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop&auto=format',
  'instant-pot-duo':     'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&auto=format',
  'dawlance-refrigerator': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format',
  'orient-ac-1ton':      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&auto=format',
  'kenwood-washing-machine': 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=400&h=400&fit=crop&auto=format',
  'philips-air-fryer':   'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=400&fit=crop&auto=format',
  'nespresso-vertuo':    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format',

  // Vehicles & Property (used in listings)
  'toyota-corolla-2021': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=280&fit=crop&auto=format',
  'honda-civic-2022':    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=280&fit=crop&auto=format',
  'suzuki-alto-2023':    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=280&fit=crop&auto=format',
  'honda-cd70':          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=280&fit=crop&auto=format',
  'gulberg-flat-2bed':   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=280&fit=crop&auto=format',
  'dha-house':           'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=280&fit=crop&auto=format',
  'bahria-apartment':    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=280&fit=crop&auto=format',
  'macbook-pro-m2-used': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=280&fit=crop&auto=format',
  'ipad-air5-used':      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=280&fit=crop&auto=format',
  'ps5-used':            'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=280&fit=crop&auto=format',
  'iphone-13-used':      'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=280&fit=crop&auto=format',
};

const CATEGORY_FALLBACK = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&auto=format',
  fashion:     'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop&auto=format',
  home:        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop&auto=format',
  vehicles:    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=280&fit=crop&auto=format',
  property:    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=280&fit=crop&auto=format',
};

function productImg(id, category) {
  return PRODUCT_IMAGES[id]
    || CATEGORY_FALLBACK[category]
    || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=400&fit=crop&auto=format';
}

// ── Real seed products (Pakistan market — June 2024 pricing) ─────────────────
const SEED_PRODUCTS = [
  // ── Flash Sale ──────────────────────────────────────────────────────────────
  {
    id: "iphone-15-pro",
    name: "Apple iPhone 15 Pro 256GB Natural Titanium",
    category: "electronics", emoji: "📱",
    price: 319999, oldPrice: 379999, discount: 16,
    rating: 4.8, reviews: 2347, badge: "sale", section: "flash",
    seller: "iStore PK", sellerRating: 4.9, inStock: true, freeDelivery: true,
    specs: ["A17 Pro chip", "48MP Triple Camera", "USB-C", "Titanium frame"],
    createdAt: Timestamp.now()
  },
  {
    id: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra 12GB/512GB Titanium Black",
    category: "electronics", emoji: "📲",
    price: 229999, oldPrice: 269999, discount: 15,
    rating: 4.7, reviews: 1893, badge: "hot", section: "flash",
    seller: "Samsung Zone PK", sellerRating: 4.8, inStock: true, freeDelivery: true,
    specs: ["Snapdragon 8 Gen 3", "200MP Camera", "S-Pen included", "5000mAh"],
    createdAt: Timestamp.now()
  },
  {
    id: "macbook-air-m2",
    name: "Apple MacBook Air M2 13\" 8GB/256GB Midnight",
    category: "electronics", emoji: "💻",
    price: 199999, oldPrice: 229999, discount: 13,
    rating: 4.9, reviews: 1102, badge: "hot", section: "flash",
    seller: "Apple Premium Reseller", sellerRating: 4.9, inStock: true, freeDelivery: true,
    specs: ["M2 chip", "18hr battery", "Liquid Retina display", "MagSafe charging"],
    createdAt: Timestamp.now()
  },
  {
    id: "sony-xm5",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones Black",
    category: "electronics", emoji: "🎧",
    price: 52999, oldPrice: 68000, discount: 22,
    rating: 4.8, reviews: 1654, badge: "sale", section: "flash",
    seller: "Sony Center Pakistan", sellerRating: 4.8, inStock: true, freeDelivery: true,
    specs: ["Industry-leading ANC", "30hr battery", "Multipoint connection", "LDAC Hi-Res"],
    createdAt: Timestamp.now()
  },
  {
    id: "nike-air-max-270",
    name: "Nike Air Max 270 React Triple White Men's US10",
    category: "fashion", emoji: "👟",
    price: 22999, oldPrice: 34000, discount: 32,
    rating: 4.9, reviews: 987, badge: "sale", section: "flash",
    seller: "Nike Flagship Store", sellerRating: 4.7, inStock: true, freeDelivery: false,
    specs: ["Air unit heel", "React foam midsole", "Mesh upper", "Available US7-US12"],
    createdAt: Timestamp.now()
  },
  {
    id: "hp-pavilion",
    name: "HP Pavilion 15 Core i5-1235U 16GB RAM 512GB SSD",
    category: "electronics", emoji: "💻",
    price: 94999, oldPrice: 115000, discount: 17,
    rating: 4.4, reviews: 521, badge: "new", section: "flash",
    seller: "HP Authorized Dealer PK", sellerRating: 4.6, inStock: true, freeDelivery: true,
    specs: ["Intel Core i5 12th Gen", "16GB DDR4", "512GB NVMe SSD", "Full HD 15.6\""],
    createdAt: Timestamp.now()
  },
  {
    id: "ps5-slim",
    name: "Sony PlayStation 5 Slim Disc Edition 1TB White",
    category: "electronics", emoji: "🎮",
    price: 119999, oldPrice: 139999, discount: 14,
    rating: 4.9, reviews: 2109, badge: "hot", section: "flash",
    seller: "PlayStation PK", sellerRating: 4.9, inStock: false, freeDelivery: true,
    specs: ["Custom AMD CPU/GPU", "825GB SSD", "4K gaming", "DualSense controller"],
    createdAt: Timestamp.now()
  },
  {
    id: "samsung-buds2-pro",
    name: "Samsung Galaxy Buds2 Pro Graphite True Wireless ANC",
    category: "electronics", emoji: "🎶",
    price: 18999, oldPrice: 26999, discount: 30,
    rating: 4.6, reviews: 744, badge: "sale", section: "flash",
    seller: "Samsung Zone PK", sellerRating: 4.8, inStock: true, freeDelivery: false,
    specs: ["Hi-Fi 24bit audio", "Active Noise Cancelling", "360° audio", "IPX7"],
    createdAt: Timestamp.now()
  },

  // ── Recommended For You ──────────────────────────────────────────────────────
  {
    id: "dyson-v15",
    name: "Dyson V15 Detect Absolute Cordless Vacuum Cleaner",
    category: "home", emoji: "🌀",
    price: 89999, oldPrice: 105000, discount: 14,
    rating: 4.9, reviews: 388, badge: "hot", section: "reco",
    seller: "Dyson Pakistan", sellerRating: 4.9, inStock: true, freeDelivery: true,
    specs: ["Laser dust detection", "240AW suction", "60min runtime", "HEPA filtration"],
    createdAt: Timestamp.now()
  },
  {
    id: "casio-gshock",
    name: "Casio G-Shock GA-2100 CasiOak Carbon Black & Gold",
    category: "fashion", emoji: "⌚",
    price: 19500, oldPrice: 24000, discount: 19,
    rating: 4.7, reviews: 712, badge: "sale", section: "reco",
    seller: "Casio Official PK", sellerRating: 4.7, inStock: true, freeDelivery: false,
    specs: ["200m water resistance", "Carbon core guard", "Solar-powered", "World time 31 zones"],
    createdAt: Timestamp.now()
  },
  {
    id: "instant-pot-duo",
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker 6 Litre",
    category: "home", emoji: "🍲",
    price: 24999, oldPrice: 32000, discount: 22,
    rating: 4.6, reviews: 291, badge: "new", section: "reco",
    seller: "Kitchen Corner PK", sellerRating: 4.5, inStock: true, freeDelivery: true,
    specs: ["7-in-1 multi-use", "6L capacity", "14 smart programmes", "Dishwasher safe"],
    createdAt: Timestamp.now()
  },
  {
    id: "levis-511-slim",
    name: "Levi's 511 Slim Fit Jeans Dark Indigo Stonewash W32 L32",
    category: "fashion", emoji: "👖",
    price: 9499, oldPrice: 13500, discount: 30,
    rating: 4.8, reviews: 934, badge: "sale", section: "reco",
    seller: "Levi's Store PK", sellerRating: 4.6, inStock: true, freeDelivery: false,
    specs: ["99% Cotton 1% Elastane", "Slim fit", "Mid rise", "Available W28-W38"],
    createdAt: Timestamp.now()
  },
  {
    id: "gopro-hero12",
    name: "GoPro HERO12 Black Action Camera 5.3K60 + Accessories Bundle",
    category: "electronics", emoji: "📷",
    price: 99000, oldPrice: 119000, discount: 17,
    rating: 4.9, reviews: 1041, badge: "hot", section: "reco",
    seller: "GoPro Authorized PK", sellerRating: 4.8, inStock: true, freeDelivery: true,
    specs: ["5.3K60 + 4K120 video", "HyperSmooth 6.0", "27MP photos", "Waterproof 10m"],
    createdAt: Timestamp.now()
  },
  {
    id: "dawlance-refrigerator",
    name: "Dawlance 9 CFT Single Door Refrigerator Chrome Silver",
    category: "home", emoji: "❄️",
    price: 49999, oldPrice: 62000, discount: 19,
    rating: 4.5, reviews: 623, badge: "sale", section: "reco",
    seller: "Dawlance Official Store", sellerRating: 4.6, inStock: true, freeDelivery: true,
    specs: ["9 cubic feet", "Direct cool", "Vitamin fresh", "5-year compressor warranty"],
    createdAt: Timestamp.now()
  },
  {
    id: "khaadi-kurta",
    name: "Khaadi Unstitched 3-Piece Lawn Suit Summer Collection 2024",
    category: "fashion", emoji: "👗",
    price: 6499, oldPrice: 8500, discount: 24,
    rating: 4.7, reviews: 1287, badge: "new", section: "reco",
    seller: "Khaadi Official", sellerRating: 4.8, inStock: true, freeDelivery: false,
    specs: ["100% lawn fabric", "Embroidered front", "Printed dupatta", "Ready to ship"],
    createdAt: Timestamp.now()
  },
  {
    id: "philips-air-fryer",
    name: "Philips Essential Air Fryer 4.1L Rapid Air Technology",
    category: "home", emoji: "🍟",
    price: 18999, oldPrice: 24000, discount: 21,
    rating: 4.6, reviews: 456, badge: "hot", section: "reco",
    seller: "Philips PK Official", sellerRating: 4.7, inStock: true, freeDelivery: true,
    specs: ["4.1L capacity", "Up to 90% less fat", "Digital touchscreen", "13 preset modes"],
    createdAt: Timestamp.now()
  },
  {
    id: "adidas-ultraboost",
    name: "Adidas Ultraboost 22 Running Shoes Core Black Men's",
    category: "fashion", emoji: "👟",
    price: 28999, oldPrice: 38000, discount: 24,
    rating: 4.8, reviews: 567, badge: "sale", section: "reco",
    seller: "Adidas Official PK", sellerRating: 4.7, inStock: true, freeDelivery: false,
    specs: ["BOOST midsole", "Primeknit+ upper", "Continental rubber outsole", "UK sizes 7-12"],
    createdAt: Timestamp.now()
  },
];

// ── Real classified listings ──────────────────────────────────────────────────
const SEED_LISTINGS = [
  {
    id: "toyota-corolla-2021",
    name: "Toyota Corolla Altis Grande 1.8 CVT 2021 — 42,000 km",
    category: "vehicles", location: "lahore",
    price: 5450000, emoji: "🚗",
    seller: "AutoDeals PK", sellerPhone: "0300-1234567",
    condition: "Used", year: 2021, mileage: "42,000 km",
    description: "First owner, all original, full service history, no accidents. Genuine sale.",
    createdAt: Timestamp.now()
  },
  {
    id: "honda-civic-2022",
    name: "Honda Civic RS 1.5 Turbo 2022 — 28,500 km Pearl White",
    category: "vehicles", location: "karachi",
    price: 6950000, emoji: "🚗",
    seller: "Prime Motors Karachi", sellerPhone: "0321-9876543",
    condition: "Used", year: 2022, mileage: "28,500 km",
    description: "Single owner, Honda dealership maintained, all accessories intact.",
    createdAt: Timestamp.now()
  },
  {
    id: "gulberg-flat-2bed",
    name: "2-Bed Apartment Gulberg III Lahore — Ready to Move In",
    category: "property", location: "lahore",
    price: 27500000, emoji: "🏢",
    seller: "Prime Realty Lahore", sellerPhone: "0333-4445555",
    condition: "New", area: "1,100 sq ft",
    description: "5th floor, gated community, 24/7 security, backup generator, parking included.",
    createdAt: Timestamp.now()
  },
  {
    id: "macbook-pro-m2-used",
    name: "MacBook Pro M2 Pro 14\" 16GB/512GB Space Grey — Like New",
    category: "electronics", location: "islamabad",
    price: 299999, emoji: "💻",
    seller: "TechResale ISB", sellerPhone: "0345-6789012",
    condition: "Used - Excellent", year: 2023,
    description: "Purchased 8 months ago, used lightly. Full box with all accessories. No dents or scratches.",
    createdAt: Timestamp.now()
  },
  {
    id: "suzuki-alto-2023",
    name: "Suzuki Alto VXR 2023 — Only 12,000 km Silky Silver",
    category: "vehicles", location: "rawalpindi",
    price: 2150000, emoji: "🚗",
    seller: "Pak Auto Hub", sellerPhone: "0311-2223334",
    condition: "Used", year: 2023, mileage: "12,000 km",
    description: "Company maintained, under warranty till Dec 2025. No claim insurance.",
    createdAt: Timestamp.now()
  },
  {
    id: "dha-house",
    name: "5 Marla House DHA Phase 6 Lahore — Furnished Available",
    category: "property", location: "lahore",
    price: 48000000, emoji: "🏡",
    seller: "DHA Properties Ltd", sellerPhone: "0307-8889990",
    condition: "Used", area: "5 Marla",
    description: "Corner plot house, double storey, 3 beds, 2 baths, separate servant quarter.",
    createdAt: Timestamp.now()
  },
  {
    id: "iphone-13-used",
    name: "iPhone 13 128GB Blue — Excellent Condition PTA Approved",
    category: "electronics", location: "karachi",
    price: 109999, emoji: "📱",
    seller: "Mobile World Saddar", sellerPhone: "0300-7778889",
    condition: "Used - Excellent",
    description: "Non-PTA converted, battery health 93%, all original accessories, original box.",
    createdAt: Timestamp.now()
  },
  {
    id: "honda-cd70",
    name: "Honda CD70 Dream 2023 New Shape — 8,500 km",
    category: "vehicles", location: "faisalabad",
    price: 185000, emoji: "🏍️",
    seller: "Honda Bikes Faisalabad", sellerPhone: "0300-1122334",
    condition: "Used", year: 2023, mileage: "8,500 km",
    description: "Self registration, all papers complete, good condition, daily use.",
    createdAt: Timestamp.now()
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return "Rs. " + n.toLocaleString("en-PK");
}
function starsHtml(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
function reviewsLabel(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n;
}
function timeAgo(ts) {
  if (!ts) return "Just now";
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60)  return "Just now";
  if (secs < 3600) return Math.floor(secs/60) + "m ago";
  if (secs < 86400) return Math.floor(secs/3600) + "h ago";
  return Math.floor(secs/86400) + "d ago";
}

// ── Render helpers ───────────────────────────────────────────────────────────
function productCardHtml(p) {
  const badgeClass = p.badge === "hot" ? "badge-hot" : p.badge === "new" ? "badge-new" : "badge-sale";
  const badgeLabel = p.badge === "hot" ? "HOT" : p.badge === "new" ? "NEW" : `-${p.discount}%`;
  const oldPriceHtml = p.oldPrice > p.price
    ? `<span class="price-old">${formatPrice(p.oldPrice)}</span><span class="price-off">-${p.discount}%</span>`
    : "";
  const stockBadge = p.inStock === false
    ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;border-radius:0;z-index:2"><span style="background:#333;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:.5px">OUT OF STOCK</span></div>`
    : "";
  const freeDeliveryHtml = p.freeDelivery
    ? `<div style="margin-top:3px;font-size:10px;color:var(--teal);font-weight:600;">✓ Free Delivery</div>`
    : "";
  const imgSrc = productImg(p.id, p.category);
  return `
    <div class="product-card" role="article" data-category="${p.category}" data-price="${p.price}" data-rating="${p.rating}" data-discount="${p.discount}" onclick="goToProduct('${p.id}')">
      <div class="pc-img">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="pc-img-fallback" style="display:none">${p.emoji}</span>
        <span class="pc-badge ${badgeClass}">${badgeLabel}</span>
        <button class="pc-wish" data-id="${p.id}" onclick="event.stopPropagation();toggleWishlist(this)" aria-label="Add ${p.name} to wishlist" aria-pressed="false">♡</button>
        ${stockBadge}
      </div>
      <div class="pc-info">
        <div class="pc-name">${p.name}</div>
        <div class="pc-price">
          <span class="price-now">${formatPrice(p.price)}</span>
          ${oldPriceHtml}
        </div>
        <div class="pc-rating"><span class="stars">${starsHtml(p.rating)}</span> ${p.rating} (${reviewsLabel(p.reviews)})</div>
        ${freeDeliveryHtml}
      </div>
      <button class="add-cart" onclick="event.stopPropagation();addToCart('${p.name}','${formatPrice(p.price)}','${p.emoji}')" aria-label="Add ${p.name} to cart" ${p.inStock === false ? "disabled style='background:#aaa;cursor:not-allowed'" : ""}>🛒 Add to Cart</button>
    </div>`;
}

function listingCardHtml(l) {
  const ago = timeAgo(l.createdAt);
  const imgSrc = productImg(l.id, l.category);
  const conditionHtml = l.condition
    ? `<span style="background:#e8f5e9;color:#2e7d32;font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;margin-left:4px">${l.condition}</span>`
    : "";
  return `
    <div class="listing-card" role="article" aria-label="${l.name}" data-category="${l.category}" data-location="${l.location}" data-price="${l.price}" onclick="goToProduct('${l.id}')">
      <div class="lc-img">
        <img src="${imgSrc}" alt="${l.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="lc-img-fallback" style="display:none">${l.emoji}</span>
      </div>
      <div class="lc-info">
        <div class="lc-price">${formatPrice(l.price)}</div>
        <div class="lc-title">${l.name}</div>
        <div class="lc-meta">📍 ${l.location.charAt(0).toUpperCase() + l.location.slice(1)} &nbsp;·&nbsp; ${ago} ${conditionHtml}</div>
        <div class="lc-seller" style="margin-top:4px;font-size:11px;color:var(--text-muted)">🏪 ${l.seller}</div>
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

// ── Versioned seed: clears old data, writes fresh seed ──────────────────────
async function seedIfNeeded() {
  // Check if current version already seeded
  const versionRef = doc(db, "_meta", "seed_version");
  let currentVersion = null;
  try {
    const vSnap = await getDocs(query(collection(db, "_meta"), limit(1)));
    vSnap.forEach(d => { if (d.id === "seed_version") currentVersion = d.data().version; });
  } catch (e) { /* first run */ }

  if (currentVersion === SEED_VERSION) {
    console.log("[Bazaar] Seed already at", SEED_VERSION, "— skipping");
    return;
  }

  console.log("[Bazaar] Seeding Firestore with", SEED_PRODUCTS.length, "products and", SEED_LISTINGS.length, "listings...");

  // Clear old products and listings
  try {
    const oldProducts = await getDocs(collection(db, "products"));
    for (const d of oldProducts.docs) await deleteDoc(d.ref);
    const oldListings = await getDocs(collection(db, "listings"));
    for (const d of oldListings.docs) await deleteDoc(d.ref);
  } catch (e) {
    console.warn("[Bazaar] Could not clear old data:", e.message);
  }

  // Write new data
  for (const p of SEED_PRODUCTS) {
    const { id: _id, ...data } = p;
    await setDoc(doc(db, "products", p.id), data);
  }
  for (const l of SEED_LISTINGS) {
    const { id: _id, ...data } = l;
    await setDoc(doc(db, "listings", l.id), data);
  }

  // Mark version
  await setDoc(versionRef, { version: SEED_VERSION, seededAt: Timestamp.now() });
  console.log("[Bazaar] Seed complete:", SEED_VERSION);
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
    grid.innerHTML = snap.docs.map(d => renderFn({ ...d.data(), id: d.id, _docId: d.id })).join("");
    if (typeof renderGrid === "function") renderGrid(gridId);
  } catch (e) {
    console.error("[Bazaar] Firestore load error:", e);
    grid.innerHTML = "<p style='padding:16px;color:#888'>Could not load products. Check Firestore rules.</p>";
  }
}

async function init() {
  await seedIfNeeded();
  loadGrid("flashGrid",      "products", "flash",  productCardHtml);
  loadGrid("recoGrid",       "products", "reco",   productCardHtml);
  loadGrid("classifiedGrid", "listings", null,     listingCardHtml);
}

init();
