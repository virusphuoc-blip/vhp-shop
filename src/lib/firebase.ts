import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore'
import { USE_EMULATOR } from './env'

const e = import.meta.env

const config = {
  apiKey: e.VITE_FIREBASE_API_KEY,
  authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID,
  storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: e.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && (USE_EMULATOR || config.appId))

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

function init() {
  if (app || !firebaseConfigured) return
  app = initializeApp(config)
  auth = getAuth(app)
  db = initializeFirestore(app, { localCache: memoryLocalCache() })
  if (USE_EMULATOR) {
    const host = window.location.hostname.endsWith('localhost') ? '127.0.0.1' : window.location.hostname
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
    connectFirestoreEmulator(db, host, 8080)
  }
}

export function getFirebaseAuth(): Auth {
  init()
  if (!auth) throw new Error('Firebase chưa được cấu hình.')
  return auth
}

export function getDb(): Firestore {
  init()
  if (!db) throw new Error('Firebase chưa được cấu hình.')
  return db
}
