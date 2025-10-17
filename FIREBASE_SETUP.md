# Firebase Setup Guide

This guide explains how to set up Firebase for the ScanItKnowIt application.

## Prerequisites

1. A Google account
2. A Firebase project (create one at https://console.firebase.google.com/)

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "ScanItKnowIt")
4. Accept the terms and conditions
5. Select if you want to enable Google Analytics (optional)
6. Click "Create project"

### 2. Generate Service Account Key

1. In the Firebase Console, click the gear icon (Project settings)
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" to download the JSON file
5. Save this file securely (you'll need the values for environment variables)

### 3. Enable Firestore Database

1. In the Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development only)
4. Choose a location near you
5. Click "Enable"

### 4. Enable Firebase Authentication

1. In the Firebase Console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the "Email/Password" sign-in provider
4. Optionally enable other providers (Google, Facebook, etc.)

### 5. Environment Variables

Set these environment variables in your deployment environment:

```bash
# Firebase configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# Your existing environment variables
OPENROUTER_API_KEY=your-openrouter-api-key
JWT_SECRET=your-jwt-secret
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
```

The Firebase service account values can be found in the JSON file you downloaded:
- FIREBASE_PROJECT_ID: The "project_id" field
- FIREBASE_CLIENT_EMAIL: The "client_email" field
- FIREBASE_PRIVATE_KEY: The "private_key" field (keep the newlines as \n)

### 6. Install Dependencies

Make sure to install the Firebase dependencies:

```bash
cd server
npm install firebase-admin
```

### 7. Deploy Firestore Security Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Deploy the security rules:
   ```bash
   firebase deploy --only firestore,storage
   ```

## Security Rules (Production)

For production, update your Firestore security rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Product analyses are accessible only to their owners
    match /product_analyses/{analysisId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Chat messages are accessible only to their owners
    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Storage Security Rules (Production)

For production, update your Firebase Storage security rules in the Firebase Console:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // User profile images
    match /users/{userId}/profile.{extension} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Product images
    match /products/{analysisId}/image.{extension} {
      allow read;
      // Secure write access: Only allow write if user owns the corresponding analysis
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/product_analyses/$(analysisId)).data.userId == request.auth.uid;
    }
  }
}
```

## Migration from SQLite

If you're migrating from the existing SQLite database, you'll need to transfer your data to Firestore. This would typically involve:

1. Exporting data from SQLite
2. Transforming it to match the Firestore document structure
3. Importing it into Firestore collections

The data structure in Firestore matches the existing SQLite tables:
- `users` collection
- `product_analyses` collection
- `chat_messages` collection

## Firebase Authentication Integration

The application now supports Firebase Authentication for user management:

1. **User Registration**: Users are created in Firebase Authentication
2. **User Login**: Authentication is handled by Firebase Auth
3. **Token Verification**: ID tokens are verified using Firebase Admin SDK
4. **Backward Compatibility**: Still supports JWT tokens for existing clients

## Client-Side Integration (Optional)

If you want to integrate Firebase directly on the client-side for real-time updates:

1. Add Firebase SDK to your client:
   ```bash
   cd client
   npm install firebase
   ```

2. Initialize Firebase in your client application:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdefghijk"
   };
   
   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   const db = getFirestore(app);
   ```

3. Use Firebase Auth for user authentication:
   ```javascript
   import { signInWithEmailAndPassword } from 'firebase/auth';
   
   // Sign in
   signInWithEmailAndPassword(auth, email, password)
     .then((userCredential) => {
       // Signed in
       const user = userCredential.user;
       // Get ID token for server requests
       user.getIdToken().then((idToken) => {
         // Send idToken to your server
       });
     })
     .catch((error) => {
       // Handle error
     });
   ```

4. Use Firestore for real-time data:
   ```javascript
   import { collection, query, where, onSnapshot } from 'firebase/firestore';
   
   // Listen for real-time updates
   const q = query(collection(db, "product_analyses"), where("userId", "==", user.uid));
   const unsubscribe = onSnapshot(q, (querySnapshot) => {
     const analyses = [];
     querySnapshot.forEach((doc) => {
       analyses.push({ id: doc.id, ...doc.data() });
     });
     // Update UI with analyses
   });
   ```

## Testing the Connection

You can test the Firebase connection by running:

```bash
npm run dev
```

And then checking the logs for Firebase initialization messages.