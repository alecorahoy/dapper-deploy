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
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { doc, serverTimestamp, setDoc, terminate, clearIndexedDbPersistence } from "firebase/firestore"
import { auth, authReady, db, googleProvider } from "../firebase.js"

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
    authReady.then(() => getRedirectResult(auth)).then((result) => {
      if (cancelled || !result?.user) return
      setUser(result.user)
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
      await authReady
      const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(u, { displayName })
        // onAuthStateChanged already synced the profile BEFORE updateProfile
        // ran, so the doc has displayName: "" — sync again with the real name.
        syncUserProfile(u).catch((err) => {
          console.warn("[Dapper Auth] Could not re-sync profile after signup", err)
        })
      }
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
      await authReady
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
      await authReady
      const { user: u } = await signInWithPopup(auth, googleProvider)
      setUser(u)
      syncUserProfile(u).catch((err) => {
        console.warn("[Dapper Auth] Could not sync Google user profile", err)
      })
      return u
    } catch (e) {
      const shouldRedirect = [
        "auth/popup-blocked",
        "auth/operation-not-supported-in-this-environment",
      ].includes(e.code)

      if (shouldRedirect) {
        try {
          await signInWithRedirect(auth, googleProvider)
          return null
        } catch (redirectError) {
          console.error("[Dapper Auth] Google redirect failed", redirectError.code, redirectError.message)
          setError(friendlyError(redirectError.code))
          return null
        }
      }

      console.error("[Dapper Auth] Google sign-in failed", e.code, e.message)
      setError(friendlyError(e.code))
      return null
    } finally { setLoading(false) }
  }

  // ── Sign out ──
  const logOut = async () => {
    await signOut(auth)
  }

  // ── Delete account (irreversible) ──
  // 1) re-authenticate (the server refuses tokens from a sign-in older than
  //    5 min), 2) server deletes data + the Auth account, 3) wipe this
  //    browser's copies (per-user local keys + Firestore offline cache).
  // Returns { ok:true } or { ok:false, code, error } — never throws.
  const deleteAccount = async ({ password } = {}) => {
    const current = auth.currentUser
    if (!current) return { ok:false, code:"signed_out", error:"Sign in first." }
    try {
      const providers = current.providerData.map((p) => p.providerId)
      if (providers.includes("password")) {
        if (!password) return { ok:false, code:"password_required", error:"Enter your password to confirm." }
        await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password))
      } else {
        await reauthenticateWithPopup(current, googleProvider)
      }
    } catch (e) {
      console.warn("[Dapper Auth] Re-authentication failed", e.code)
      return { ok:false, code:"reauth_failed", error: e.code === "auth/popup-closed-by-user" ? "Confirmation cancelled." : friendlyError(e.code) }
    }
    let data = {}
    try {
      const idToken = await current.getIdToken(true)
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: "{}",
      })
      data = await res.json().catch(() => ({}))
      if (!res.ok) return { ok:false, code: data.code || `http_${res.status}`, error: data.error || "Could not delete your account. Please try again." }
    } catch (e) {
      console.error("[Dapper Auth] Delete account request failed", e)
      return { ok:false, code:"network", error:"Could not reach the server. Check your connection and try again." }
    }
    const uid = current.uid
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(`dapper.user.${uid}`)).forEach((k) => localStorage.removeItem(k))
    } catch { /* storage blocked — nothing to clear */ }
    await signOut(auth).catch(() => {})
    await terminate(db).catch(() => {})
    await clearIndexedDbPersistence(db).catch(() => {})
    return { ok:true }
  }

  return { user, loading, error, clearError, signUp, signIn, signInGoogle, logOut, deleteAccount }
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
