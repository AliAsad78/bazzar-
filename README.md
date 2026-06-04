# Bazaar — Setup Guide

## Your site now has real auth! Here's how to go live in ~10 minutes.

---

## Step 1 — Create a free Firebase project

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"** → give it a name (e.g. `bazaar-pk`) → Continue
3. Disable Google Analytics (optional) → **Create project**

### Enable Authentication
- Left sidebar → **Build → Authentication** → **Get started**
- Click **Email/Password** → Enable → **Save**

### Enable Firestore Database
- Left sidebar → **Build → Firestore Database** → **Create database**
- Choose **"Start in test mode"** → pick your region (e.g. `asia-south1` for Pakistan) → **Enable**

### Get your config keys
- Go to **Project Settings** (gear icon, top left)
- Scroll to **"Your apps"** → click **"</> Web"** icon
- Register app (any nickname) → copy the `firebaseConfig` object

---

## Step 2 — Paste your keys into firebase-config.js

Open `firebase-config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",          // ← your real key
  authDomain:        "bazaar-pk.firebaseapp.com",
  projectId:         "bazaar-pk",
  storageBucket:     "bazaar-pk.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Add Bazaar auth system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/bazaar.git
git push -u origin main
```

---

## Step 4 — Deploy on Vercel (free)

1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"New Project"** → Import your `bazaar` repo
3. Leave all settings as default → **Deploy**
4. Done! Your live URL will be `bazaar-xxx.vercel.app`

---

## File Structure

```
bazaar/
├── index.html                  ← Homepage (auth modal integrated)
├── bazaar-product-detail.html  ← Product page
├── bazaar-seller.html          ← Seller dashboard (protected)
├── profile.html                ← Profile edit page (NEW)
├── auth.js                     ← All auth logic (NEW)
├── firebase-config.js          ← Your Firebase keys (NEW)
└── README.md
```

---

## How it works

| Feature | Details |
|---|---|
| Register | Choose Buyer or Seller role · email + password |
| Login | Email + password |
| Profile edit | Name, phone, city, bio, shop name (sellers) |
| Seller dashboard | Protected — redirects to login if not a seller |
| Header | Shows user initials when logged in · click → profile page |
| Sign out | Available from profile page or seller sidebar |

---

## Firestore Security Rules (update before going public)

After testing, go to **Firestore → Rules** and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read:   if request.auth != null;
      allow write:  if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures users can only edit their own profile.

---

## That's it! Everything is free:
- Firebase Spark plan: 10,000 auth users/month, 1GB Firestore — **free**
- Vercel Hobby plan: unlimited static deploys — **free**
- GitHub: free public/private repos — **free**
