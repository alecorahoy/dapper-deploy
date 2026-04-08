import { useState, useEffect } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "../firebase.js"

export function useAuth() {
  const [user,    setUser]    = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
      if (u) syncUserProfile(u).catch((err) => {
        console.warn("[Dapper Auth] Could not sync user profile", err)
      })
    })
    return unsub
  }, [])

  useEffect(() => {
    let cancelled = false
    getRedirectResult(auth).then((result) => {
      if (cancelled || !result?.user) return
      syncUserProfile(result.user).catch((err) => {
        console.warn("[Dapper Auth] Could not sync redirected user profile", err)
      })
    }).catch((e) => {
      console.error("[Dapper Auth] Google redirect failed", e.code, e.message)
      if (!cancelled) setError(friendlyError(e.code))
    })
    return () => { cancelled = true }
  }, [])

  const clearError = () => setError(null)

  // ── Sign up with email ──
  const signUp = async (email, password, displayName) => {
    setLoading(true); setError(null)
    try {
      const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) await updateProfile(u, { displayName })
      return u
    } catch (e) {
      setError(friendlyError(e.code))
      return null
    } finally { setLoading(false) }
  }

  // ── Sign in with email ──
  const signIn = async (email, password) => {
    setLoading(true); setError(null)
    try {
      const { user: u } = await signInWithEmailAndPassword(auth, email, password)
      return u
    } catch (e) {
      setError(friendlyError(e.code))
      return null
    } finally { setLoading(false) }
  }

  // ── Sign in with Google ──
  const signInGoogle = async () => {
    setLoading(true); setError(null)
    try {
      const { user: u } = await signInWithPopup(auth, googleProvider)
      return u
    } catch (e) {
      console.error("[Dapper Auth] Google sign-in failed", e.code, e.message)
      if (shouldUseRedirectFallback(e.code)) {
        await signInWithRedirect(auth, googleProvider)
        return null
      }
      setError(friendlyError(e.code))
      return null
    } finally { setLoading(false) }
  }

  // ── Sign out ──
  const logOut = async () => {
    await signOut(auth)
  }

  return { user, loading, error, clearError, signUp, signIn, signInGoogle, logOut }
}

// Human-readable Firebase error messages
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":    "That email is already registered.",
    "auth/invalid-email":           "Invalid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with that email.",
    "auth/wrong-password":          "Incorrect password.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/popup-closed-by-user":    "Google sign-in was cancelled.",
    "auth/popup-blocked":           "Google sign-in popup was blocked by the browser. Allow popups for this site and try again.",
    "auth/cancelled-popup-request": "Another Google sign-in popup is already open. Close it and try again.",
    "auth/web-storage-unsupported": "This browser is blocking the storage Google sign-in needs. Try another browser or allow site storage.",
    "auth/unauthorized-domain":     "This domain is not authorized for Google sign-in. Use http://localhost:4173 locally or add this domain in Firebase Auth > Settings > Authorized domains.",
    "auth/operation-not-allowed":   "Google sign-in is not enabled in Firebase Auth. Enable Google provider in Firebase Console > Authentication > Sign-in method.",
    "auth/account-exists-with-different-credential": "An account already exists with this email using a different sign-in method.",
    "auth/network-request-failed":  "Network error. Check your connection.",
  }
  return map[code] || "Something went wrong. Please try again."
}

function shouldUseRedirectFallback(code) {
  return [
    "auth/popup-blocked",
    "auth/cancelled-popup-request",
    "auth/web-storage-unsupported",
  ].includes(code)
}

async function syncUserProfile(user) {
  const email = user.email || ""
  await setDoc(doc(db, "userProfiles", user.uid), {
    uid: user.uid,
    email,
    emailLower: email.toLowerCase(),
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    providerIds: user.providerData?.map((p) => p.providerId) || [],
    lastSeenAt: serverTimestamp(),
  }, { merge: true })
}
