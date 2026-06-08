// auth.js — Shared auth logic for all Bazaar pages
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Current user state (available globally) ──────────────────
window.currentUser    = null;
window.currentProfile = null;

// ── showNotif — works whether page defines its own or not ─────
function showNotif(msg) {
  if (typeof window.showNotif === "function") {
    window.showNotif(msg);
    return;
  }
  let n = document.getElementById("notif");
  if (!n) {
    n = document.createElement("div");
    n.id = "notif";
    n.style.cssText = [
      "position:fixed","bottom:24px","left:50%","transform:translateX(-50%)",
      "background:#222","color:#fff","padding:10px 22px","border-radius:8px",
      "font-size:14px","z-index:99999","opacity:0","transition:opacity .3s",
      "pointer-events:none","white-space:nowrap"
    ].join(";");
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.style.opacity = "1";
  clearTimeout(n._t);
  n._t = setTimeout(() => { n.style.opacity = "0"; }, 2800);
}

// ── Safely fetch Firestore profile (never throws to caller) ───
async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("Firestore profile fetch failed:", e.code || e.message);
    return null;
  }
}

// ── Auth state listener ───────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;
  if (user) {
    window.currentProfile = await fetchProfile(user.uid);
  } else {
    window.currentProfile = null;
  }
  updateHeaderUI();

  // Seller-page guard
  if (window.location.pathname.includes("bazaar-seller")) {
    if (!user) {
      showNotif("🔒 Please sign in as a seller first.");
      setTimeout(() => window.location.href = "index.html", 1500);
    } else if (window.currentProfile && window.currentProfile.role !== "seller") {
      showNotif("🚫 Seller account required.");
      setTimeout(() => window.location.href = "index.html", 1500);
    }
  }
});

// ── Update header Sign In button ─────────────────────────────
function updateHeaderUI() {
  const btn      = document.getElementById("authHeaderBtn");
  const btnLabel = document.getElementById("authHeaderLabel");
  if (!btn) return;

  if (window.currentProfile) {
    const initials = (window.currentProfile.name || "U")
      .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:50%;background:var(--orange);color:#fff;
      font-family:'Syne',sans-serif;font-weight:700;font-size:12px;">${initials}</span>`;
    if (btnLabel) btnLabel.textContent = window.currentProfile.name.split(" ")[0];
    btn.onclick = () => window.location.href = "profile.html";
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/></svg>`;
    if (btnLabel) btnLabel.textContent = "Sign In";
    btn.onclick = window.openAuthModal;
  }
}

// ── MODAL OPEN/CLOSE ─────────────────────────────────────────
window.openAuthModal = function(defaultTab) {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("open");
  window.switchTab(defaultTab || "login");
};

window.closeAuthModal = function() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("open");
  clearAuthErrors();
};

window.switchTab = function(tab) {
  const lf = document.getElementById("loginForm");
  const rf = document.getElementById("registerForm");
  if (lf) lf.style.display = tab === "login"    ? "block" : "none";
  if (rf) rf.style.display = tab === "register" ? "block" : "none";
  document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(`.auth-tab[data-tab="${tab}"]`).forEach(t => t.classList.add("active"));
};

function clearAuthErrors() {
  document.querySelectorAll(".auth-error").forEach(e => e.textContent = "");
}

// ── REGISTER ─────────────────────────────────────────────────
window.doRegister = async function() {
  clearAuthErrors();
  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const phone    = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  const role     = document.querySelector('input[name="reg-role"]:checked')?.value;
  const shopName = document.getElementById("reg-shop")?.value.trim() || "";
  const errEl    = document.getElementById("reg-error");

  // ── Validation ──
  if (!name)     { errEl.textContent = "Please enter your full name.";  return; }
  if (!email)    { errEl.textContent = "Please enter your email.";      return; }
  if (!phone)    { errEl.textContent = "Please enter your phone number."; return; }
  if (!password) { errEl.textContent = "Please enter a password.";      return; }
  if (!role)     { errEl.textContent = "Please select Buyer or Seller."; return; }
  if (password.length < 6) {
    errEl.textContent = "Password must be at least 6 characters."; return;
  }
  if (role === "seller" && !shopName) {
    errEl.textContent = "Please enter your shop name."; return;
  }

  const btn = document.getElementById("reg-btn");
  btn.textContent = "Creating account..."; btn.disabled = true;

  try {
    // Step 1: Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Step 2: Save profile to Firestore
    const profile = {
      name, email, phone, role,
      city: "", bio: "",
      shopName: role === "seller" ? shopName : "",
      createdAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, "users", cred.user.uid), profile);
    } catch (fsErr) {
      // Auth account created — profile save failed (Firestore rules?)
      // Still let them in, log the issue
      console.error("Firestore setDoc failed:", fsErr.code, fsErr.message);
    }

    window.currentUser    = cred.user;
    window.currentProfile = profile;
    window.closeAuthModal();
    showNotif(`✅ Welcome to Bazaar, ${name}!`);
    updateHeaderUI();

    if (role === "seller") {
      setTimeout(() => window.location.href = "bazaar-seller.html", 1000);
    }
  } catch (err) {
    // This catch only fires for Auth errors (createUserWithEmailAndPassword)
    console.error("Register error:", err.code, err.message);
    errEl.textContent = friendlyError(err.code || err.message);
    btn.textContent = "Create Account"; btn.disabled = false;
  }
};

// ── LOGIN ────────────────────────────────────────────────────
window.doLogin = async function() {
  clearAuthErrors();
  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");

  if (!email || !password) {
    errEl.textContent = "Please enter your email and password."; return;
  }

  const btn = document.getElementById("login-btn");
  btn.textContent = "Signing in..."; btn.disabled = true;

  try {
    // Step 1: Firebase Auth sign-in (this is the only thing that should throw auth errors)
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Step 2: Fetch Firestore profile separately — failure here must NOT block login
    window.currentUser    = cred.user;
    window.currentProfile = await fetchProfile(cred.user.uid);

    // Step 3: Close modal and greet user
    window.closeAuthModal();
    const firstName = (window.currentProfile?.name || "there").split(" ")[0];
    showNotif(`✅ Welcome back, ${firstName}!`);
    updateHeaderUI();

  } catch (err) {
    // Only auth errors reach here now (Firestore errors are swallowed in fetchProfile)
    console.error("Login error:", err.code, err.message);
    errEl.textContent = friendlyError(err.code || err.message);
    btn.textContent = "Sign In"; btn.disabled = false;
  }
};

// ── LOGOUT ───────────────────────────────────────────────────
window.doLogout = async function() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Sign out error:", e);
  }
  window.currentUser    = null;
  window.currentProfile = null;
  showNotif("👋 Signed out successfully.");
  updateHeaderUI();
  if (window.location.pathname.includes("bazaar-seller") ||
      window.location.pathname.includes("profile")) {
    setTimeout(() => window.location.href = "index.html", 1000);
  }
};

// ── PROFILE UPDATE ───────────────────────────────────────────
window.doUpdateProfile = async function() {
  if (!window.currentUser) return;
  const errEl = document.getElementById("profile-error");
  const okEl  = document.getElementById("profile-ok");
  if (errEl) errEl.textContent = "";
  if (okEl)  okEl.textContent  = "";

  const updates = {
    name:     document.getElementById("prof-name")?.value.trim()  || window.currentProfile?.name  || "",
    phone:    document.getElementById("prof-phone")?.value.trim() || window.currentProfile?.phone || "",
    city:     document.getElementById("prof-city")?.value.trim()  || "",
    bio:      document.getElementById("prof-bio")?.value.trim()   || "",
  };
  if (window.currentProfile?.role === "seller") {
    updates.shopName = document.getElementById("prof-shop")?.value.trim() || "";
  }

  const btn = document.getElementById("prof-save-btn");
  if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

  try {
    await updateDoc(doc(db, "users", window.currentUser.uid), updates);
    Object.assign(window.currentProfile, updates);
    if (okEl) okEl.textContent = "✅ Profile updated!";
    updateHeaderUI();
  } catch (err) {
    console.error("Profile update error:", err.code, err.message);
    if (errEl) errEl.textContent = "Failed to save. Try again.";
  } finally {
    if (btn) { btn.textContent = "Save Changes"; btn.disabled = false; }
  }
};

// ── Role toggle for register form ────────────────────────────
window.toggleRoleField = function() {
  const role    = document.querySelector('input[name="reg-role"]:checked')?.value;
  const shopRow = document.getElementById("shop-name-row");
  if (shopRow) shopRow.style.display = role === "seller" ? "block" : "none";
};

// ── Error code → human message ───────────────────────────────
function friendlyError(code) {
  const map = {
    // Auth errors
    "auth/email-already-in-use":    "This email is already registered.",
    "auth/invalid-email":           "Invalid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/invalid-login-credentials":"Incorrect email or password.",
    "auth/too-many-requests":       "Too many failed attempts. Try again later.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/user-disabled":           "This account has been disabled.",
    "auth/popup-closed-by-user":    "Sign-in popup was closed.",
    "auth/requires-recent-login":   "Please sign in again to continue.",
    "auth/email-already-exists":    "This email is already registered.",
    "auth/operation-not-allowed":   "Email sign-in is not enabled. Contact support.",
    // Firestore errors (shouldn't reach here now but just in case)
    "permission-denied":            "Access denied. Please sign in again.",
    "unavailable":                  "Service unavailable. Check your connection.",
  };
  if (map[code]) return map[code];
  // Extract code from full message string if err.code was undefined
  for (const [key, val] of Object.entries(map)) {
    if (code && code.includes(key)) return val;
  }
  return "Something went wrong. Please try again.";
}
