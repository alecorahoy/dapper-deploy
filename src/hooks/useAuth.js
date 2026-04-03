import { useState, useEffect } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth"
import { auth, googleProvider } from "../firebase.js"

export function useAuth() {
  const [user,    setUser]    = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
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
    "auth/network-request-failed":  "Network error. Check your connection.",
  }
  return map[code] || "Something went wrong. Please try again."
}
