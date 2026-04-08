import { useState, useEffect } from "react"
import {
  doc, collection,
  setDoc, deleteDoc, updateDoc,
  onSnapshot,
  query, orderBy,
  serverTimestamp,
  deleteField,
} from "firebase/firestore"
import { db } from "../firebase.js"

const GUEST_CLOSET_KEY = "dapper.guestClosetItems.v1"
const FREE_ENTITLEMENT = {
  plan: "free",
  status: "active",
  source: "default",
  label: "Free",
}

function readGuestCloset(fallbackItems) {
  if (typeof window === "undefined") return fallbackItems
  try {
    const raw = window.localStorage.getItem(GUEST_CLOSET_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : fallbackItems
  } catch (err) {
    console.warn("[Dapper] Could not read guest closet", err)
    return fallbackItems
  }
}

function writeGuestCloset(items) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(GUEST_CLOSET_KEY, JSON.stringify(items))
  } catch (err) {
    console.warn("[Dapper] Could not save guest closet", err)
  }
}

function closetItemId(item) {
  return String(item?.id || `closet-${Date.now()}`)
}

function userSeedKey(uid) {
  return `dapper.user.${uid}.closetSeeded.v1`
}

function hasSeededCloset(uid) {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(userSeedKey(uid)) === "true"
  } catch {
    return false
  }
}

function markClosetSeeded(uid) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(userSeedKey(uid), "true")
  } catch (err) {
    console.warn("[Dapper] Could not mark closet as seeded", err)
  }
}

function normalizeDate(value) {
  if (!value) return null
  if (value?.toDate) return value.toDate()
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function normalizeEntitlement(data) {
  if (!data) return FREE_ENTITLEMENT
  const expiresAt = normalizeDate(data.expiresAt)
  if (data.status !== "active") return { ...FREE_ENTITLEMENT, previousStatus: data.status || "inactive" }
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return { ...FREE_ENTITLEMENT, previousStatus: "expired", expiredEntitlement: data }
  }
  const plan = data.plan || "free"
  return {
    ...FREE_ENTITLEMENT,
    ...data,
    plan,
    label: plan === "elite" ? "Elite" : plan === "pro" ? "Pro" : "Free",
    expiresAt,
  }
}

export function useEntitlement(user) {
  const [entitlement, setEntitlement] = useState(FREE_ENTITLEMENT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user === undefined) return
    if (!user) { setEntitlement(FREE_ENTITLEMENT); setLoading(false); setError(null); return }
    setLoading(true)
    const ref = doc(db, "entitlements", user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      setEntitlement(normalizeEntitlement(snap.exists() ? snap.data() : null))
      setLoading(false)
      setError(null)
    }, (err) => {
      console.warn("[Dapper] Could not load entitlement", err)
      setEntitlement(FREE_ENTITLEMENT)
      setLoading(false)
      setError("Could not load account plan.")
    })
    return unsub
  }, [user?.uid])

  return { entitlement, loading, error }
}

export function useAdminAccess(user) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user === undefined) return
    if (!user) { setIsAdmin(false); setAdminProfile(null); setLoading(false); setError(null); return }
    setLoading(true)
    const ref = doc(db, "admins", user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      setIsAdmin(Boolean(data))
      setAdminProfile(data)
      setLoading(false)
      setError(null)
    }, (err) => {
      console.warn("[Dapper] Could not load admin access", err)
      setIsAdmin(false)
      setAdminProfile(null)
      setLoading(false)
      setError("Could not verify admin access.")
    })
    return unsub
  }, [user?.uid])

  return { isAdmin, adminProfile, loading, error }
}

export function useAdminUsers(user, isAdmin) {
  const [profiles, setProfiles] = useState([])
  const [entitlements, setEntitlements] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !isAdmin) { setProfiles([]); setEntitlements({}); setLoading(false); return }
    setLoading(true)
    const profilesRef = query(collection(db, "userProfiles"), orderBy("emailLower"))
    const entitlementsRef = collection(db, "entitlements")
    const unsubProfiles = onSnapshot(profilesRef, (snap) => {
      setProfiles(snap.docs.map((d) => ({ ...d.data(), uid: d.id })))
      setLoading(false)
      setError(null)
    }, (err) => {
      console.error("[Dapper Admin] Could not load users", err)
      setError("Could not load users. Check Firestore admin rules.")
      setLoading(false)
    })
    const unsubEntitlements = onSnapshot(entitlementsRef, (snap) => {
      const next = {}
      snap.docs.forEach((d) => { next[d.id] = normalizeEntitlement(d.data()) })
      setEntitlements(next)
      setError(null)
    }, (err) => {
      console.error("[Dapper Admin] Could not load entitlements", err)
      setError("Could not load plans. Check Firestore admin rules.")
    })
    return () => { unsubProfiles(); unsubEntitlements() }
  }, [user?.uid, isAdmin])

  const grantEntitlement = async ({ uid, email, plan, expiresAt, note }) => {
    if (!user || !isAdmin) throw new Error("Admin access required.")
    if (!uid) throw new Error("Missing user uid.")
    setSaving(true); setError(null)
    try {
      const parsedExpiry = expiresAt ? new Date(`${expiresAt}T23:59:59`) : null
      await setDoc(doc(db, "entitlements", uid), {
        uid,
        email: email || "",
        plan,
        status: "active",
        source: "admin_comp",
        note: note || "",
        grantedBy: user.uid,
        grantedByEmail: user.email || "",
        grantedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: parsedExpiry && !Number.isNaN(parsedExpiry.getTime()) ? parsedExpiry : null,
      }, { merge: true })
    } catch (err) {
      console.error("[Dapper Admin] Could not grant entitlement", err)
      setError("Could not update that account plan.")
      throw err
    } finally {
      setSaving(false)
    }
  }

  const revokeEntitlement = async ({ uid, email, note }) => {
    if (!user || !isAdmin) throw new Error("Admin access required.")
    if (!uid) throw new Error("Missing user uid.")
    setSaving(true); setError(null)
    try {
      await setDoc(doc(db, "entitlements", uid), {
        uid,
        email: email || "",
        plan: "free",
        status: "revoked",
        source: "admin_revoked",
        note: note || "",
        revokedBy: user.uid,
        revokedByEmail: user.email || "",
        revokedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: null,
      }, { merge: true })
    } catch (err) {
      console.error("[Dapper Admin] Could not revoke entitlement", err)
      setError("Could not revoke that account plan.")
      throw err
    } finally {
      setSaving(false)
    }
  }

  return { profiles, entitlements, loading, saving, error, grantEntitlement, revokeEntitlement }
}

function communityInitials(user) {
  const name = user?.displayName || user?.email || "Dapper Member"
  const parts = name.split(/[\s@._-]+/).filter(Boolean)
  return (parts[0]?.[0] || "D").toUpperCase() + (parts[1]?.[0] || "").toUpperCase()
}

function communityAvatarColor(seed = "") {
  const palette = ["#1B3A6B", "#36454F", "#722F37", "#355E3B", "#8B6914", "#0f172a", "#800020"]
  const score = String(seed).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return palette[score % palette.length]
}

export function useCommunityPosts(user) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    const ref = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(ref, (snap) => {
      setPosts(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
      setLoading(false)
      setError(null)
    }, (err) => {
      console.warn("[Dapper Community] Could not load posts", err)
      setPosts([])
      setLoading(false)
      setError("Could not load community posts.")
    })
    return unsub
  }, [])

  const createPost = async ({ look, outfit, caption, tags, badge }) => {
    if (!user) throw new Error("Sign in required.")
    setSaving(true); setError(null)
    try {
      const postRef = doc(collection(db, "communityPosts"))
      const authorName = user.displayName || user.email?.split("@")[0] || "Dapper Member"
      await setDoc(postRef, {
        uid: user.uid,
        authorName,
        authorEmail: user.email || "",
        authorInitials: communityInitials(user),
        avatar: communityAvatarColor(user.uid),
        badge: badge || "Member",
        role: badge === "Elite" ? "Elite Member" : badge === "Pro" ? "Pro Member" : "Member",
        look: look || "Today's Look",
        outfit,
        caption,
        tags: Array.isArray(tags) ? tags : [],
        likedBy: {},
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return postRef.id
    } catch (err) {
      console.error("[Dapper Community] Could not create post", err)
      setError("Could not publish this post.")
      throw err
    } finally {
      setSaving(false)
    }
  }

  const toggleLike = async (post) => {
    if (!user || !post?.id || post._demo) return
    const alreadyLiked = Boolean(post.likedBy?.[user.uid])
    const update = {
      updatedAt: serverTimestamp(),
      [`likedBy.${user.uid}`]: alreadyLiked ? deleteField() : true,
    }
    await updateDoc(doc(db, "communityPosts", post.id), update)
  }

  return { posts, loading, saving, error, createPost, toggleLike }
}

export function useCloset(user, fallbackItems) {
  const [items, setItems] = useState(() => readGuestCloset(fallbackItems))
  const [synced, setSynced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user === undefined) return
    if (!user) { setItems(readGuestCloset(fallbackItems)); setSynced(false); setError(null); return }
    let seeded = false
    let cancelled = false
    const ref = collection(db, "users", user.uid, "closetItems")
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.empty) {
        if (!seeded && fallbackItems.length) {
          seeded = true
          try {
            if (cancelled) return
            if (!hasSeededCloset(user.uid)) {
              setItems(fallbackItems)
              await seedCloset(user.uid, fallbackItems)
              markClosetSeeded(user.uid)
            } else {
              setItems([])
            }
          } catch (err) {
            console.error("[Dapper] Closet seed failed", err)
            setError("Could not sync closet. Please try again.")
            setItems([])
          }
        } else {
          setItems([])
        }
      } else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setItems(loaded)
        markClosetSeeded(user.uid)
        setError(null)
      }
      setSynced(true)
    }, (err) => {
      console.error("[Dapper] Closet sync failed", err)
      setError("Could not sync closet. Please check your Firebase connection.")
      setSynced(false)
    })
    return () => { cancelled = true; unsub() }
  }, [user?.uid, fallbackItems])

  const addItem = async (item) => {
    const id = closetItemId(item)
    const nextItem = { ...item, id, occasions: item.occasions || [] }
    if (!user) {
      setItems(prev => {
        const next = [...prev, nextItem]
        writeGuestCloset(next)
        return next
      })
      return nextItem
    }
    setSaving(true); setError(null)
    setItems(prev => [...prev, nextItem])
    try {
      await setDoc(doc(db, "users", user.uid, "closetItems", id), { ...nextItem, createdAt: serverTimestamp() }, { merge: true })
      return nextItem
    } catch (err) {
      console.error("[Dapper] Could not save closet item", err)
      setError("Could not save this garment. Please try again.")
      setItems(prev => prev.filter(i => String(i.id) !== id))
      throw err
    } finally {
      setSaving(false)
    }
  }
  const updateItem = async (id, data) => {
    if (!user) {
      setItems(prev => {
        const next = prev.map(i => String(i.id) === String(id) ? { ...i, ...data } : i)
        writeGuestCloset(next)
        return next
      })
      return
    }
    await updateDoc(doc(db, "users", user.uid, "closetItems", String(id)), data)
  }
  const removeItem = async (id) => {
    if (!user) {
      setItems(prev => {
        const next = prev.filter(i => String(i.id) !== String(id))
        writeGuestCloset(next)
        return next
      })
      return
    }
    await deleteDoc(doc(db, "users", user.uid, "closetItems", String(id)))
  }
  const updateCloset = async (updater) => {
    if (!user) {
      setItems(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater
        writeGuestCloset(next)
        return next
      })
      return
    }
    const next = typeof updater === "function" ? updater(items) : updater
    setItems(next)
    const currentIds = new Set(items.map(i => String(i.id)))
    const nextIds = new Set(next.map(i => String(i.id)))
    for (const item of items) { if (!nextIds.has(String(item.id))) await removeItem(String(item.id)) }
    for (const item of next) {
      const itemRef = doc(db, "users", user.uid, "closetItems", String(item.id))
      if (currentIds.has(String(item.id))) await setDoc(itemRef, { ...item }, { merge: true })
      else await setDoc(itemRef, { ...item })
    }
  }
  return { items, addItem, updateItem, removeItem, updateCloset, synced, saving, error }
}

export function useWornLog(user, fallbackLog) {
  const [wornLog, setWornLog] = useState(fallbackLog)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user) { setWornLog(fallbackLog); setSynced(false); return }
    let seeded = false
    const ref = collection(db, "users", user.uid, "wornLogEntries")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty) {
        if (!seeded && fallbackLog.length) {
          seeded = true
          setWornLog(fallbackLog)
          seedWornLog(user.uid, fallbackLog).catch(console.error)
        } else {
          setWornLog([])
        }
      } else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setWornLog(loaded)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid, fallbackLog])

  const saveEntry = async (entry) => {
    if (!user) { setWornLog(p => [entry, ...p.filter(e => e.date !== entry.date)]); return }
    await setDoc(doc(db, "users", user.uid, "wornLogEntries", String(entry.id)), { ...entry })
  }
  const deleteEntry = async (id) => {
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "wornLogEntries", String(id)))
  }
  return { wornLog, saveEntry, deleteEntry, synced }
}

export function useCalendarEvents(user, fallbackEvents) {
  const [events, setEvents] = useState(fallbackEvents)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user) { setEvents(fallbackEvents); setSynced(false); return }
    let seeded = false
    const ref = collection(db, "users", user.uid, "calendarDays")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty) {
        if (!seeded && Object.keys(fallbackEvents).length) {
          seeded = true
          setEvents(fallbackEvents)
          seedCalendarEvents(user.uid, fallbackEvents).catch(console.error)
        } else {
          setEvents({})
        }
      } else {
        const loaded = {}
        snap.docs.forEach(d => { loaded[d.id] = d.data() })
        setEvents(loaded)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid, fallbackEvents])

  const saveEvent = async (dateKey, occasion, outfit) => {
    const data = { outfit, occasion, color: "#080f1e" }
    if (!user) { setEvents(p => ({ ...p, [dateKey]: data })); return }
    await setDoc(doc(db, "users", user.uid, "calendarDays", dateKey), data)
  }
  const deleteEvent = async (dateKey) => {
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "calendarDays", dateKey))
  }
  return { events, saveEvent, deleteEvent, synced }
}

async function seedCloset(uid, items) {
  for (const item of items) {
    await setDoc(doc(db, "users", uid, "closetItems", String(item.id)), item)
  }
}
async function seedWornLog(uid, entries) {
  for (const entry of entries) {
    await setDoc(doc(db, "users", uid, "wornLogEntries", String(entry.id)), entry)
  }
}
async function seedCalendarEvents(uid, events) {
  for (const [dateKey, data] of Object.entries(events)) {
    await setDoc(doc(db, "users", uid, "calendarDays", dateKey), data)
  }
}
