import { initializeApp } from "firebase/app"
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth"
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"
import { firebaseConfig } from "./firebaseConfig.js"


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Persistent local cache: offline writes queue in IndexedDB and survive a
// refresh instead of hanging the UI on an await that never resolves.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const googleProvider = new GoogleAuthProvider()

export const authReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[Dapper Auth] Could not set local auth persistence", err)
})
