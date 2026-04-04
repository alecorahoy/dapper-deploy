import { useState, useEffect } from "react"
import {
  doc, collection,
  getDoc, getDocs,
  setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase.js"

export function useCloset(user, fallbackItems) {
  const [items, setItems] = useState(fallbackItems)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user) { setItems(fallbackItems); setSynced(false); return }
    const ref = collection(db, "users", user.uid, "closetItems")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) { seedCloset(user.uid, fallbackItems) }
      else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setItems(loaded.length ? loaded : fallbackItems)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid])

  const addItem = async (item) => {
    if (!user) return
    await addDoc(collection(db, "users", user.uid, "closetItems"), { ...item, createdAt: serverTimestamp() })
  }
  const updateItem = async (id, data) => {
    if (!user) return
    await updateDoc(doc(db, "users", user.uid, "closetItems", id), data)
  }
  const removeItem = async (id) => {
    if (!user) return
    await deleteDoc(doc(db, "users", user.uid, "closetItems", id))
  }
  const updateCloset = async (updater) => {
    if (!user) { setItems(prev => typeof updater === "function" ? updater(prev) : updater); return }
    const next = typeof updater === "function" ? updater(items) : updater
    const currentIds = new Set(items.map(i => String(i.id)))
    const nextIds = new Set(next.map(i => String(i.id)))
    for (const item of items) { if (!nextIds.has(String(item.id))) await removeItem(String(item.id)) }
    for (const item of next) {
      if (!currentIds.has(String(item.id))) {
        await setDoc(doc(db, "users", user.uid, "closetItems", String(item.id)), { ...item })
      }
    }
  }
  return { items, addItem, updateItem, removeItem, updateCloset, synced }
}

export function useWornLog(user, fallbackLog) {
  const [wornLog, setWornLog] = useState(fallbackLog)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user) { setWornLog(fallbackLog); setSynced(false); return }
    const ref = collection(db, "users", user.uid, "wornLogEntries")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) { seedWornLog(user.uid, fallbackLog) }
      else {
        const loaded = snap.docs.map(d => ({ ...d.data(), id: d.id }))
        setWornLog(loaded.length ? loaded : fallbackLog)
      }
      setSynced(true)
    })
    return unsub
  }, [user?.uid])

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
    const ref = collection(db, "users", user.uid, "calendarDays")
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.empty && !synced) { seedCalendarEvents(user.uid, fallbackEvents) }
      else {
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
