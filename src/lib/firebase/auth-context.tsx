// "use client";

// import {
//     createContext,
//     useContext,
//     useEffect,
//     useState,
//     useCallback,
//     useRef,
//     type ReactNode,
// } from "react";
// import {
//     onAuthStateChanged,
//     signInWithPopup,
//     signOut as firebaseSignOut,
//     type User as FirebaseUser,
// } from "firebase/auth";
// import { auth, googleProvider } from "./config";

// // ─── Types ──────────────────────────────────────────────────────────────────

// export type AppUser = {
//     id: string;
//     firebaseUid: string;
//     email: string | null;
//     name: string | null;
//     avatar: string | null;
//     role: "CUSTOMER" | "COOK" | "ADMIN";
// };

// type AuthState = {
//     user: AppUser | null;
//     firebaseUser: FirebaseUser | null;
//     loading: boolean;
//     error: string | null;
// };

// type AuthContextType = AuthState & {
//     signInWithGoogle: () => Promise<void>;
//     signOutUser: () => Promise<void>;
//     getIdToken: () => Promise<string | null>;
// };

// const AuthContext = createContext<AuthContextType | null>(null);

// // ─── Helper: Clear stale Firebase data from browser storage ─────────────────
// // ONLY call this when a stale/invalid session is detected — never before sign-in.

// function clearFirebaseStorage() {
//     try {
//         if (typeof indexedDB !== "undefined") {
//             ["firebaseLocalStorageDb", "firebase-heartbeat-database", "firebase-installations-database"].forEach((name) => {
//                 try { indexedDB.deleteDatabase(name); } catch { /* ignore */ }
//             });
//         }

//         if (typeof localStorage !== "undefined") {
//             const keys: string[] = [];
//             for (let i = 0; i < localStorage.length; i++) {
//                 const key = localStorage.key(i);
//                 if (key && (key.startsWith("firebase:") || key.includes("firebaseLocalStorage"))) {
//                     keys.push(key);
//                 }
//             }
//             keys.forEach((k) => { try { localStorage.removeItem(k); } catch { /* */ } });
//         }

//         if (typeof sessionStorage !== "undefined") {
//             const keys: string[] = [];
//             for (let i = 0; i < sessionStorage.length; i++) {
//                 const key = sessionStorage.key(i);
//                 if (key && (key.startsWith("firebase:") || key.includes("firebaseLocalStorage"))) {
//                     keys.push(key);
//                 }
//             }
//             keys.forEach((k) => { try { sessionStorage.removeItem(k); } catch { /* */ } });
//         }
//     } catch { /* SSR */ }
// }

// // ─── Provider ───────────────────────────────────────────────────────────────

// const MAX_SYNC_ATTEMPTS = 2;

// export function AuthProvider({ children }: { children: ReactNode }) {
//     const [state, setState] = useState<AuthState>({
//         user: null,
//         firebaseUser: null,
//         loading: true,
//         error: null,
//     });

//     const hasTriedCleanup = useRef(false);
//     const syncAttemptCount = useRef(0);

//     /**
//      * Sign out and clear stale Firebase data. Runs at most once per page load.
//      * Pass null for errorMessage to do a silent cleanup (no error shown).
//      */
//     const cleanSignOut = useCallback(async (errorMessage: string | null) => {
//         if (hasTriedCleanup.current) {
//             setState({ user: null, firebaseUser: null, loading: false, error: errorMessage });
//             return;
//         }

//         hasTriedCleanup.current = true;
//         clearFirebaseStorage();

//         try { await firebaseSignOut(auth); } catch { /* ignore */ }

//         setState({ user: null, firebaseUser: null, loading: false, error: errorMessage });
//     }, []);

//     // ── Sync Firebase user → Postgres ──
//     const syncUser = useCallback(
//         async (firebaseUser: FirebaseUser) => {
//             syncAttemptCount.current += 1;
//             if (syncAttemptCount.current > MAX_SYNC_ATTEMPTS) {
//                 console.warn("[Auth] Max sync attempts reached — cleaning up.");
//                 await cleanSignOut(null);
//                 return;
//             }

//             try {
//                 // Step 1: Get a fresh ID token (force refresh)
//                 let idToken: string;
//                 try {
//                     idToken = await firebaseUser.getIdToken(true);
//                 } catch (err) {
//                     // getIdToken failed → refresh token is dead/stale
//                     console.warn("[Auth] getIdToken(true) failed:", err);
//                     await cleanSignOut(null); // Silent cleanup
//                     return;
//                 }

//                 // Step 2: Send to backend for verification
//                 const res = await fetch("/api/auth/sync", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({ idToken }),
//                 });

//                 // Step 3: Parse response safely
//                 let body;
//                 try {
//                     body = await res.json();
//                 } catch {
//                     throw new Error("Server returned an invalid response");
//                 }

//                 // Step 4: Backend says token is invalid → silent cleanup
//                 if (res.status === 401 || res.status === 403) {
//                     console.warn("[Auth] Backend rejected token:", body?.error?.message);
//                     await cleanSignOut(null); // Silent — user just needs to sign in again
//                     return;
//                 }

//                 if (!res.ok) {
//                     throw new Error(body?.error?.message || "Sync failed");
//                 }

//                 // ✅ Success — reset guards
//                 hasTriedCleanup.current = false;
//                 syncAttemptCount.current = 0;

//                 setState({
//                     user: body.data,
//                     firebaseUser,
//                     loading: false,
//                     error: null,
//                 });
//             } catch (err) {
//                 // Non-auth errors (network issues, 500, etc.)
//                 const message = err instanceof Error ? err.message : "Authentication failed";
//                 console.error("[Auth Sync] Error:", message);
//                 setState((prev) => ({ ...prev, loading: false, error: message }));
//             }
//         },
//         [cleanSignOut]
//     );

//     // ── Listen to Firebase auth state ──
//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//             if (firebaseUser) {
//                 await syncUser(firebaseUser);
//             } else {
//                 setState({ user: null, firebaseUser: null, loading: false, error: null });
//             }
//         });
//         return () => unsubscribe();
//     }, [syncUser]);

//     // ── Sign in with Google ──
//     const signInWithGoogle = useCallback(async () => {
//         setState((prev) => ({ ...prev, loading: true, error: null }));

//         // Reset guards for fresh attempt
//         hasTriedCleanup.current = false;
//         syncAttemptCount.current = 0;

//         try {
//             await signInWithPopup(auth, googleProvider);
//             // onAuthStateChanged will fire → syncUser will run
//         } catch (err) {
//             const message = err instanceof Error ? err.message : "Google sign-in failed";
//             setState((prev) => ({ ...prev, loading: false, error: message }));
//         }
//     }, []);

//     // ── Sign out ──
//     const signOutUser = useCallback(async () => {
//         try { await firebaseSignOut(auth); } catch { /* ignore */ }
//         hasTriedCleanup.current = false;
//         syncAttemptCount.current = 0;
//         setState({ user: null, firebaseUser: null, loading: false, error: null });
//     }, []);

//     // ── Get fresh ID token for API calls ──
//     const getIdToken = useCallback(async () => {
//         if (!state.firebaseUser) return null;
//         try {
//             return await state.firebaseUser.getIdToken(true);
//         } catch {
//             await cleanSignOut(null);
//             return null;
//         }
//     }, [state.firebaseUser, cleanSignOut]);

//     return (
//         <AuthContext.Provider
//             value={{ ...state, signInWithGoogle, signOutUser, getIdToken }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// }

// // ─── Hook ───────────────────────────────────────────────────────────────────

// export function useAuth() {
//     const context = useContext(AuthContext);
//     if (!context) throw new Error("useAuth must be used within an AuthProvider");
//     return context;
// }







//////////////////////////////////////////////


"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, signInWithRedirect, getRedirectResult } from "./config";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AppUser = {
    id: string;
    firebaseUid: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    role: "CUSTOMER" | "COOK" | "ADMIN";
};

type AuthState = {
    user: AppUser | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
};

interface AuthContextType extends AuthState {
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOutUser: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
    sendPasswordReset: (email: string) => Promise<boolean>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Helper: Clear stale Firebase data from browser storage ─────────────────

function clearFirebaseStorage() {
    try {
        if (typeof indexedDB !== "undefined") {
            ["firebaseLocalStorageDb", "firebase-heartbeat-database", "firebase-installations-database"].forEach((name) => {
                try { indexedDB.deleteDatabase(name); } catch { /* ignore */ }
            });
        }

        if (typeof localStorage !== "undefined") {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("firebase:") || key.includes("firebaseLocalStorage"))) {
                    keys.push(key);
                }
            }
            keys.forEach((k) => { try { localStorage.removeItem(k); } catch { /* */ } });
        }

        if (typeof sessionStorage !== "undefined") {
            const keys: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.startsWith("firebase:") || key.includes("firebaseLocalStorage"))) {
                    keys.push(key);
                }
            }
            keys.forEach((k) => { try { sessionStorage.removeItem(k); } catch { /* */ } });
        }
    } catch { /* SSR */ }
}

// ─── Provider ───────────────────────────────────────────────────────────────

const MAX_SYNC_ATTEMPTS = 2;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        firebaseUser: null,
        loading: true,
        error: null,
    });

    // ── FIX: Track cleanup per-session, not per-provider-lifetime ──
    // These are scoped to each "session" (each onAuthStateChanged event).
    // We reset BOTH guards at the start of every new Firebase auth event
    // so that a fresh sign-in after a stale-token cleanup always works.
    const hasTriedCleanup = useRef(false);
    const syncAttemptCount = useRef(0);

    // ── Tracks the UID of the session currently being synced ──
    // Prevents a stale cleanup from a previous UID affecting a new sign-in.
    const currentSyncUid = useRef<string | null>(null);

    // ── Guards against showing the login form while a redirect result is being processed ──
    // getRedirectResult() must resolve BEFORE onAuthStateChanged(null) can set loading:false.
    // Without this, the login form flashes briefly after returning from Google.
    const redirectResultChecked = useRef(false);
    // Tracks if onAuthStateChanged fired null while redirect was still pending.
    const pendingNullAuthEvent = useRef(false);

    /**
     * Sign out and clear stale Firebase data.
     * Pass null for errorMessage to do a silent cleanup (no error shown).
     */
    const cleanSignOut = useCallback(async (errorMessage: string | null) => {
        if (hasTriedCleanup.current) {
            setState({ user: null, firebaseUser: null, loading: false, error: errorMessage });
            return;
        }

        hasTriedCleanup.current = true;
        clearFirebaseStorage();

        try { await firebaseSignOut(auth); } catch { /* ignore */ }

        setState({ user: null, firebaseUser: null, loading: false, error: errorMessage });
    }, []);

    // ── Sync Firebase user → Postgres ──
    const syncUser = useCallback(
        async (firebaseUser: FirebaseUser) => {
            // ── FIX: If UID changed (new sign-in), fully reset guards ──
            if (currentSyncUid.current !== firebaseUser.uid) {
                currentSyncUid.current = firebaseUser.uid;
                hasTriedCleanup.current = false;   // ← reset for new user session
                syncAttemptCount.current = 0;       // ← reset attempt counter
            }

            syncAttemptCount.current += 1;
            if (syncAttemptCount.current > MAX_SYNC_ATTEMPTS) {
                console.warn("[Auth] Max sync attempts reached — cleaning up.");
                await cleanSignOut(null);
                return;
            }

            try {
                // Step 1: Get a fresh ID token (force refresh)
                let idToken: string;
                try {
                    idToken = await firebaseUser.getIdToken(true);
                } catch (err) {
                    // getIdToken failed → refresh token is dead/stale
                    console.warn("[Auth] getIdToken(true) failed:", err);
                    await cleanSignOut(null); // Silent cleanup
                    return;
                }

                // Step 2: Send to backend for verification
                const res = await fetch("/api/auth/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });

                // Step 3: Parse response safely
                let body;
                try {
                    body = await res.json();
                } catch {
                    throw new Error("Server returned an invalid response");
                }

                // Step 4: Backend says token is invalid → silent cleanup
                if (res.status === 401 || res.status === 403) {
                    console.warn("[Auth] Backend rejected token:", body?.error?.message);
                    await cleanSignOut(null); // Silent — user just needs to sign in again
                    return;
                }

                if (!res.ok) {
                    throw new Error(body?.error?.message || "Sync failed");
                }

                // ✅ Success — reset guards
                hasTriedCleanup.current = false;
                syncAttemptCount.current = 0;
                currentSyncUid.current = firebaseUser.uid;

                setState({
                    user: body.data,
                    firebaseUser,
                    loading: false,
                    error: null,
                });
            } catch (err) {
                // Non-auth errors (network issues, 500, etc.)
                const message = err instanceof Error ? err.message : "Authentication failed";
                console.error("[Auth Sync] Error:", message);
                setState((prev) => ({ ...prev, loading: false, error: message }));
            }
        },
        [cleanSignOut]
    );

    // ── Handle post-redirect Google sign-in result on mount ──
    // MUST run before onAuthStateChanged processes the null event so we can
    // hold loading:true while Firebase completes the redirect handshake.
    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                redirectResultChecked.current = true;
                // No pending redirect — if onAuthStateChanged already fired null,
                // it was waiting for us; unlock loading now.
                if (!result && pendingNullAuthEvent.current) {
                    currentSyncUid.current = null;
                    hasTriedCleanup.current = false;
                    syncAttemptCount.current = 0;
                    pendingNullAuthEvent.current = false;
                    setState({ user: null, firebaseUser: null, loading: false, error: null });
                }
                // result?.user case: onAuthStateChanged will fire with the user
                // and syncUser will handle everything — nothing to do here.
            })
            .catch((err) => {
                redirectResultChecked.current = true;
                // Only surface errors that are NOT user-cancelled
                const code = (err as { code?: string })?.code ?? "";
                const msg = code !== "auth/user-cancelled" && code !== "auth/popup-closed-by-user"
                    ? (err instanceof Error ? err.message : "Google sign-in failed")
                    : null;
                if (pendingNullAuthEvent.current) {
                    pendingNullAuthEvent.current = false;
                    setState({ user: null, firebaseUser: null, loading: false, error: msg });
                } else if (msg) {
                    setState((prev) => ({ ...prev, loading: false, error: msg }));
                }
            });
    }, []);

    // ── Listen to Firebase auth state ──
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Reset pending-null flag — we have a real user now.
                pendingNullAuthEvent.current = false;
                await syncUser(firebaseUser);
            } else {
                // If getRedirectResult hasn't resolved yet, the null event might be
                // premature (Firebase fires null before it processes the redirect).
                // Hold loading:true until we know for sure there's no redirect.
                if (!redirectResultChecked.current) {
                    pendingNullAuthEvent.current = true;
                    return; // wait for getRedirectResult to decide
                }
                // Redirect result already checked — safe to unlock.
                currentSyncUid.current = null;
                hasTriedCleanup.current = false;
                syncAttemptCount.current = 0;
                setState({ user: null, firebaseUser: null, loading: false, error: null });
            }
        });
        return () => unsubscribe();
    }, [syncUser]);

    // ── Sign in with Google (redirect — never blocked by browsers) ──
    // signInWithRedirect navigates the whole page to Google's OAuth screen.
    // On return, getRedirectResult (called on mount above) picks up the result.
    // This completely eliminates the auth/popup-blocked error.
    const signInWithGoogle = useCallback(async () => {
        // Reset guards before starting a new sign-in.
        hasTriedCleanup.current = false;
        syncAttemptCount.current = 0;
        currentSyncUid.current = null;

        // Show loading while we navigate away. No error can surface here
        // because the page redirects immediately.
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            await signInWithRedirect(auth, googleProvider);
            // ↑ The browser navigates away. Code below this line never runs
            //   until the user comes back from Google (handled by getRedirectResult).
        } catch (err) {
            // Only reached if the redirect itself fails (very rare).
            const message = err instanceof Error ? err.message : "Google sign-in failed";
            setState((prev) => ({ ...prev, loading: false, error: message }));
        }
    }, []);

    // ── Sign up with Email/Password (for Cooks) ──
    const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        hasTriedCleanup.current = false;
        syncAttemptCount.current = 0;
        currentSyncUid.current = null;
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName });
            // onAuthStateChanged will fire → syncUser will run
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sign-up failed";
            const friendly = message.includes("email-already-in-use")
                ? "This email is already registered. Please login instead."
                : message;
            setState((prev) => ({ ...prev, loading: false, error: friendly }));
        }
    }, []);

    // ── Sign in with Email/Password (for Cooks) ──
    const signInWithEmail = useCallback(async (email: string, password: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        hasTriedCleanup.current = false;
        syncAttemptCount.current = 0;
        currentSyncUid.current = null;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will fire → syncUser will run
        } catch (err) {
            const message = err instanceof Error ? err.message : "Sign-in failed";
            const friendly = message.includes("invalid-credential") || message.includes("wrong-password") || message.includes("user-not-found")
                ? "Invalid email or password. Please try again."
                : message;
            setState((prev) => ({ ...prev, loading: false, error: friendly }));
        }
    }, []);

    // ── Sign out ──
    const signOutUser = useCallback(async () => {
        try { await firebaseSignOut(auth); } catch { /* ignore */ }
        hasTriedCleanup.current = false;
        syncAttemptCount.current = 0;
        currentSyncUid.current = null;
        setState({ user: null, firebaseUser: null, loading: false, error: null });
    }, []);

    // ── Get fresh ID token for API calls ──
    const getIdToken = useCallback(async () => {
        if (!state.firebaseUser) return null;
        try {
            return await state.firebaseUser.getIdToken(true);
        } catch {
            await cleanSignOut(null);
            return null;
        }
    }, [state.firebaseUser, cleanSignOut]);

    // ── Send Password Reset Email ──
    const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send reset email";
            const friendly = message.includes("user-not-found")
                ? "No account found with this email."
                : message.includes("too-many-requests")
                    ? "Too many attempts. Please try again later."
                    : "Failed to send reset email. Please check your email and try again.";
            setState((prev) => ({ ...prev, error: friendly }));
            return false;
        }
    }, []);

    // CHANGED: Added refreshUser to force re-sync after role changes (e.g., kitchen registration)
    const refreshUser = useCallback(async () => {
        if (!state.firebaseUser) return;
        // Force token refresh to pick up new custom claims
        try {
            await state.firebaseUser.getIdToken(true);
        } catch { /* ignore — syncUser will handle stale tokens */ }
        await syncUser(state.firebaseUser);
    }, [state.firebaseUser, syncUser]);

    return (
        <AuthContext.Provider
            value={{ ...state, signInWithGoogle, signUpWithEmail, signInWithEmail, signOutUser, getIdToken, sendPasswordReset, refreshUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
