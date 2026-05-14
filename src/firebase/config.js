// src/firebase/config.js — all credentials via .env
import { initializeApp }               from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore }                from 'firebase/firestore'
import { isSupported }                 from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

if (import.meta.env.DEV) {
  const missing = Object.entries(firebaseConfig).filter(([,v]) => !v).map(([k]) => k)
  if (missing.length) console.warn('[TWC] Missing .env keys:', missing.join(', '))
}

const app = initializeApp(firebaseConfig)
export const auth           = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db             = getFirestore(app)
export const VAPID_KEY      = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

export const getFirebaseMessaging = async () => {
  try {
    const supported = await isSupported()
    if (!supported) return null
    const { getMessaging } = await import('firebase/messaging')
    return getMessaging(app)
  } catch { return null }
}

export default app
