/* ============================================================
   NEXORA LABS — firebase-config.js
   ------------------------------------------------------------
   1. Go to https://console.firebase.google.com → create a project
   2. Project settings → General → "Your apps" → add a Web app
   3. Copy the config object it gives you and paste it below
   4. In the Firebase console enable:
        - Authentication → Sign-in method → Email/Password (and Google, optional)
        - Firestore Database → Create database (start in production mode)
   5. Suggested Firestore security rules are in README.md
   ============================================================ */

const firebaseConfig = {
  apiKey:            "AIzaSyBja6d3JbhgLf3sY1IDOWQqfG2tTJqSgRc",
  authDomain:         "nexora-labs-f3595.firebaseapp.com",
  projectId:          "nexora-labs-f3595",
  storageBucket:      "nexora-labs-f3595.firebasestorage.app",
  messagingSenderId:  "330360301171",
  appId:              "1:330360301171:web:0bd1cebae770e4bf466c06"
};

// Firebase v9 compat build is used so plain <script> tags (no bundler) work.
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Keep the user logged in across tabs/refreshes
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
