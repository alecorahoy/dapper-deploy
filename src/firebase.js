import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

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
export const db   = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
