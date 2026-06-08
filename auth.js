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
window.currentUser     = null;
window.currentProfile  = null;

// ── Auth state listener ───────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  window.currentUser = user;
  if (user) {
    const snap = await getDoc(doc(db, "users", user.uid));
    window.currentProfile = snap.exists() ? snap.data() : null;
  } else {
    window.currentProfile = null;
  }
  updateHeaderUI();

  // If on seller page and not a seller → redirect to home
  if (window.location.pathname.includes("bazaar-seller") && user) {
    if (window.currentProfile && window.currentProfile.role !== "seller") {
      showNotif("🚫 Seller account required.");
      setTimeout(() => window.location.href = "index.html", 1500);
    }
  }
  if (window.location.pathname.includes("bazaar-seller") && !user) {
    showNotif("🔒 Please sign in as a seller first.");
    setTimeout(() => window.location.href = "index.html", 1500);
  }
});

// ── Update header Sign In button ─────────────────────────────
function updateHeaderUI() {
  const btn = document.getElementById("authHeaderBtn");
  const btnLabel = document.getElementById("authHeaderLabel");
  if (!btn) return;
  if (window.currentProfile) {
    const initials = (window.currentProfile.name || "U")
      .split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
    btn.innerHTML = `
      <span style="
        display:inline-flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50%;
        background:var(--orange);color:#fff;
        font-family:'Syne',sans-serif;font-weight:700;font-size:12px;">
        ${initials}
      </span>`;
    if (btnLabel) btnLabel.textContent = window.currentProfile.name.split(" ")[0];
    btn.onclick = () => window.location.href = "profile.html";
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    if (btnLabel) btnLabel.textContent = "Sign In";
    btn.onclick = openAuthModal;
  }
}

// ── MODAL OPEN/CLOSE ─────────────────────────────────────────
window.openAuthModal = function(defaultTab) {
  document.getElementById("authModal").classList.add("open");
  switchTab(defaultTab || "login");
};
window.closeAuthModal = function() {
  document.getElementById("authModal").classList.remove("open");
  clearAuthErrors();
};

window.switchTab = function(tab) {
  document.getElementById("loginForm").style.display  = tab === "login"    ? "block" : "none";
  document.getElementById("registerForm").style.display = tab === "register" ? "block" : "none";
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
  const shopName = document.getElementById("reg-shop")?.value.trim();
  const errEl    = document.getElementById("reg-error");

  if (!name || !email || !phone || !password || !role) {
    errEl.textContent = "Please fill in all required fields."; return;
  }
  if (password.length < 6) {
    errEl.textContent = "Password must be at least 6 characters."; return;
  }
  if (role === "seller" && !shopName) {
    errEl.textContent = "Please enter your shop name."; return;
  }

  const btn = document.getElementById("reg-btn");
  btn.textContent = "Creating account..."; btn.disabled = true;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      name, email, phone, role,
      city: "", bio: "",
      shopName: role === "seller" ? shopName : "",
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    window.currentProfile = profile;
    closeAuthModal();
    showNotif(`✅ Welcome to Bazaar, ${name}!`);
    updateHeaderUI();
    if (role === "seller") {
      setTimeout(() => window.location.href = "bazaar-seller.html", 1000);
    }
  } catch (err) {
    errEl.textContent = friendlyError(err.code);
    btn.textContent = "Create Account"; btn.disabled = false;
  }
};

// ── LOGIN ────────────────────────────────────────────────────
window.doLogin = async function() {
  clearAuthErrors();
  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");

  if (!email || !password) { errEl.textContent = "Please enter email and password."; return; }

  const btn = document.getElementById("login-btn");
  btn.textContent = "Signing in..."; btn.disabled = true;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    window.currentProfile = snap.data();
    closeAuthModal();
    showNotif(`✅ Welcome back, ${window.currentProfile.name.split(" ")[0]}!`);
    updateHeaderUI();
    if (window.currentProfile.role === "seller" &&
        window.location.pathname.includes("index")) {
      // stay on index, they can navigate
    }
  } catch (err) {
    errEl.textContent = friendlyError(err.code);
    btn.textContent = "Sign In"; btn.disabled = false;
  }
};

// ── LOGOUT ───────────────────────────────────────────────────
window.doLogout = async function() {
  await signOut(auth);
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
    name:     document.getElementById("prof-name")?.value.trim()  || window.currentProfile.name,
    phone:    document.getElementById("prof-phone")?.value.trim() || window.currentProfile.phone,
    city:     document.getElementById("prof-city")?.value.trim()  || "",
    bio:      document.getElementById("prof-bio")?.value.trim()   || "",
  };
  if (window.currentProfile.role === "seller") {
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
    if (errEl) errEl.textContent = "Failed to save. Try again.";
  } finally {
    if (btn) { btn.textContent = "Save Changes"; btn.disabled = false; }
  }
};

// ── Role toggle for register form ────────────────────────────
window.toggleRoleField = function() {
  const role = document.querySelector('input[name="reg-role"]:checked')?.value;
  const shopRow = document.getElementById("shop-name-row");
  if (shopRow) shopRow.style.display = role === "seller" ? "block" : "none";
};

// ── Helpers ──────────────────────────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/invalid-email":          "Invalid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/invalid-credential":     "Incorrect email or password.",
    "auth/too-many-requests":      "Too many attempts. Try again later.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
