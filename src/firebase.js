import { initializeApp } from "firebase/app"
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth"
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDe9e5VB5tvef8i4Cdpcrx9eegMNRm3A70",
  authDomain: "dapper---app.firebaseapp.com",
  projectId: "dapper---app",
  storageBucket: "dapper---app.firebasestorage.app",
  messagingSenderId: "715528581227",
  appId: "1:715528581227:web:fb4e83368f34ba6f00c12e"
}

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
