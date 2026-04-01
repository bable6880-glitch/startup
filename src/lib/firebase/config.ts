// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";

// const firebaseConfig = {
//     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
//     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
//     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
//     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//     measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
// };

// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// const auth = getAuth(app);

// const googleProvider = new GoogleAuthProvider();

// export { app, auth, googleProvider };



import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signInWithRedirect, getRedirectResult, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

// ── FIX: Set explicit persistence so Firebase uses the correct project's storage ──
// This prevents token bleed-over when you switch Firebase projects.
// browserLocalPersistence is the default, but calling it explicitly forces
// Firebase to reinitialise its storage bucket under the new projectId.
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("[Auth Config] Could not set persistence:", err);
    });
}

const googleProvider = new GoogleAuthProvider();

// ── Recommended: force account selection so users aren't auto-logged in ──
// with a stale account when you switch Firebase projects.
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signInWithRedirect, getRedirectResult, signInWithPopup };