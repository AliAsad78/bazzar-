# Firestore Security Rules — Required Setup

**If login shows "Something went wrong" or users can't read/write data, your Firestore rules are blocking requests.**

## Setup Steps

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your **bazaar-pk** project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Replace the rules with the following and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Seed version metadata — allow read/write always (used by products.js)
    match /_meta/{docId} {
      allow read, write: if true;
    }

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    match /products/{productId} {
      // Anyone can read products
      allow read: if true;
      // Anyone can seed initial data (seed script runs on page load)
      allow create, update, delete: if true;
    }

    match /listings/{listingId} {
      allow read: if true;
      allow create, update, delete: if true;
    }
  }
}
```

> **Note:** The permissive `allow create, update, delete: if true` rules are fine for development/seeding.
> Once your data is live and stable, tighten them to require `request.auth != null`.

## Also Enable Email/Password Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Click **Save**

Without this, all sign-in and register attempts will fail.

## How the Real-Data Seed Works

`products.js` uses a **versioned seed** stored in Firestore at `_meta/seed_version`.

- On first load, it writes all real products & listings to Firestore.
- It **won't re-seed** if the version matches (so your live user edits are safe).
- To force a re-seed with updated data, bump `SEED_VERSION` in `products.js` (e.g. `"v4-real-2024"`).
