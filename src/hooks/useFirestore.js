import { useState, useEffect } from "react"
import {
  doc, collection,
  getDoc, getDocs,
  setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase.js"

// ─────────────────────────────────────────────
// Helper — user's root path
// ─────────────────────────────────────────────
const userPath = (uid) => `users/${uid}`

// ─────────────────────────────────────────────
// HOOK: useCloset
// Replaces: localStorage "dapper_closet"
// ─────────────────────────────────────────────
export function useCloset(user, fallbackItems) {
  const [items,   setItems]   = useState(fallbackItems)
  const [synced,  setSynced]  = useState(false)

  useEffect(() => {
    if (!user) { setItems(fallbackItems); setSynced(false); return }

    // Real-time listener
    const ref = collection(db, userPath(user.uid), "closet", "items")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) {
        // First login — seed Firestore with fallback items
        seedCloset(user.uid, fallbackItems)
      } else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setItems(loaded.length ? loaded : fallbackItems)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid])

  const addItem = async (item) => {
    if (!user) return
    const ref = collection(db, userPath(user.uid), "closet", "items")
    await addDoc(ref, { ...item, createdAt: serverTimestamp() })
  }

  const updateItem = async (id, data) => {
    if (!user) return
    const ref = doc(db, userPath(user.uid), "closet", "items", id)
    await updateDoc(ref, data)
  }

  const removeItem = async (id) => {
    if (!user) return
    const ref = doc(db, userPath(user.uid), "closet", "items", id)
    await deleteDoc(ref)
  }

  // setItems-compatible updater (for legacy code using functional updates)
  const updateCloset = async (updater) => {
    if (!user) {
      setItems(prev => typeof updater === "function" ? updater(prev) : updater)
      return
    }
    const next = typeof updater === "function" ? updater(items) : updater
    // Diff: find added/removed
    const currentIds = new Set(items.map(i => String(i.id)))
    const nextIds    = new Set(next.map(i => String(i.id)))
    // Removed
    for (const item of items) {
      if (!nextIds.has(String(item.id))) await removeItem(String(item.id))
    }
    // Added
    for (const item of next) {
      if (!currentIds.has(String(item.id))) {
        const ref = doc(db, userPath(user.uid), "closet", "items", String(item.id))
        await setDoc(ref, { ...item })
      }
    }
  }

  return { items, addItem, updateItem, removeItem, updateCloset, synced }
}

// ─────────────────────────────────────────────
// HOOK: useWornLog
// Replaces: WORN_LOG_INIT state in CalendarPage
// ─────────────────────────────────────────────
export function useWornLog(user, fallbackLog) {
  const [wornLog, setWornLog] = useState(fallbackLog)
  const [synced,  setSynced]  = useState(false)

  useEffect(() => {
    if (!user) { setWornLog(fallbackLog); setSynced(false); return }

    const ref = collection(db, userPath(user.uid), "wornLog", "entries")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) {
        seedWornLog(user.uid, fallbackLog)
      } else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setWornLog(loaded.length ? loaded : fallbackLog)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid])

  const saveEntry = async (entry) => {
    if (!user) {
      setWornLog(p => [entry, ...p.filter(e => e.date !== entry.date)])
      return
    }
    const ref = doc(db, userPath(user.uid), "wornLog", "entries", String(entry.id))
    await setDoc(ref, { ...entry })
  }

  const deleteEntry = async (id) => {
    if (!user) return
    const ref = doc(db, userPath(user.uid), "wornLog", "entries", String(id))
    await deleteDoc(ref)
  }

  return { wornLog, saveEntry, deleteEntry, synced }
}

// ─────────────────────────────────────────────
// HOOK: useCalendarEvents
// Replaces: CALENDAR_EVENTS_INIT state
// ─────────────────────────────────────────────
export function useCalendarEvents(user, fallbackEvents) {
  const [events, setEvents] = useState(fallbackEvents)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user) { setEvents(fallbackEvents); setSynced(false); return }

    const ref = collection(db, userPath(user.uid), "calendarEvents", "days")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) {
        seedCalendarEvents(user.uid, fallbackEvents)
      } else {
        const loaded = {}
        snap.docs.forEach(d => { loaded[d.id] = d.data() })
        setEvents(Object.keys(loaded).length ? loaded : fallbackEvents)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid])

  const saveEvent = async (dateKey, occasion, outfit) => {
    const data = { outfit, occasion, color: "#080f1e" }
    if (!user) {
      setEvents(p => ({ ...p, [dateKey]: data }))
      return
    }
    const ref = doc(db, userPath(user.uid), "calendarEvents", "days", dateKey)
    await setDoc(ref, data)
  }

  const deleteEvent = async (dateKey) => {
    if (!user) return
    const ref = doc(db, userPath(user.uid), "calendarEvents", "days", dateKey)
    await deleteDoc(ref)
  }

  return { events, saveEvent, deleteEvent, synced }
}

// ─────────────────────────────────────────────
// SEEDERS — run once on first login
// ─────────────────────────────────────────────
async function seedCloset(uid, items) {
  for (const item of items) {
    const ref = doc(db, `users/${uid}/closet/items/${item.id}`)
    await setDoc(ref, item)
  }
}

async function seedWornLog(uid, entries) {
  for (const entry of entries) {
    const ref = doc(db, `users/${uid}/wornLog/entries/${entry.id}`)
    await setDoc(ref, entry)
  }
}

async function seedCalendarEvents(uid, events) {
  for (const [dateKey, data] of Object.entries(events)) {
    const ref = doc(db, `users/${uid}/calendarEvents/days/${dateKey}`)
    await setDoc(ref, data)
  }
}
