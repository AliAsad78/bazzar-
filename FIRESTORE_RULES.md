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
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Allow creating a new profile during registration
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    match /products/{productId} {
      // Anyone can read products
      allow read: if true;
      // Only authenticated sellers can create/edit their own products
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.sellerId == request.auth.uid;
    }
  }
}
```

## Also Enable Email/Password Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Click **Save**

Without this, all sign-in and register attempts will fail.
