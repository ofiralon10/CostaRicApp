import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyAs9TP-TpsfC2PtdhzG6ELea-v_W8TTDGo',
  authDomain: 'costaricapp-2026.firebaseapp.com',
  projectId: 'costaricapp-2026',
  storageBucket: 'costaricapp-2026.firebasestorage.app',
  messagingSenderId: '1005193058269',
  appId: '1:1005193058269:web:99703b084a0538e89b4834',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')

let messaging: Messaging | null = null
export async function getMessagingInstance() {
  if (messaging) return messaging
  const supported = await isSupported()
  if (!supported) return null
  messaging = getMessaging(app)
  return messaging
}

export { getToken, onMessage }
