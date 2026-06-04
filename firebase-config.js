// ============================================================
//  STEP 1: Replace the values below with YOUR Firebase project
//  Go to: console.firebase.google.com → Your Project →
//  Project Settings → General → "Your apps" → Web app config
// ============================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
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
