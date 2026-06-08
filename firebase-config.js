// ============================================================
//  Firebase configuration for bazaar-pk project
//  Go to: console.firebase.google.com → Your Project →
//  Project Settings → General → "Your apps" → Web app config
// ============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyB50zIMIcTvdcht17nnY12FT6kwbZ9tNiA",
  authDomain:        "bazaar-pk.firebaseapp.com",
  projectId:         "bazaar-pk",
  storageBucket:     "bazaar-pk.firebasestorage.app",
  messagingSenderId: "901423405491",
  appId:             "1:901423405491:web:2b70ee6b2a1ef612d253c6",
  measurementId:     "G-Z952DPZ8KS"
};

// ============================================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================================
import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }                                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }                           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
