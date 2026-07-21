import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { db, getMessagingInstance, getToken, onMessage } from '../firebase'
import { useAuth } from '../context/AuthContext'

const VAPID_KEY = 'BAf-PGNHEZewo6bI0jzL1Dm0_z9x_adCzqwUIl8DneBHDgTgFpC3rwFmHU6j_P-qENrLddMw9bQTgKfuMexxt9E'

// Stable per-device id so each device (PC, phone, tablet) stores its own token
function getDeviceId(): string {
  let id = localStorage.getItem('device-id')
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem('device-id', id)
  }
  return id
}

export function useNotifications() {
  const { member } = useAuth()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member) { setLoading(false); return }
    // This device is "enabled" only if THIS device's token doc exists
    getDoc(doc(db, 'fcm-tokens', getDeviceId())).then(snap => {
      setEnabled(snap.exists())
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [member])

  const enable = useCallback(async () => {
    if (!member) return false
    setError(null)

    if (!('Notification' in window)) {
      setError('הדפדפן לא תומך בהתראות')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError(permission === 'denied' ? 'ההתראות חסומות בהגדרות הדפדפן' : 'לא אושרו התראות')
        return false
      }

      const messaging = await getMessagingInstance()
      if (!messaging) {
        setError('FCM לא נתמך בדפדפן זה')
        return false
      }

      let sw = await navigator.serviceWorker.getRegistration()
      if (!sw) {
        sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      }
      await navigator.serviceWorker.ready
      if (sw.installing || sw.waiting) {
        await new Promise<void>(resolve => {
          const worker = (sw!.installing || sw!.waiting)!
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') resolve()
          })
          if (worker.state === 'activated') resolve()
        })
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: sw,
      })

      if (!token) {
        setError('לא הצלחנו לקבל טוקן — בדקו הגדרות VAPID')
        return false
      }

      // One doc per device → a member can receive on PC, phone, and tablet at once
      await setDoc(doc(db, 'fcm-tokens', getDeviceId()), {
        token,
        memberId: member.id,
        name: member.name,
        platform: navigator.userAgent,
        updatedAt: Date.now(),
      })

      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title || '', {
            body: payload.notification.body,
            icon: '/images/icon-192.png',
          })
        }
      })

      setEnabled(true)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      setError(msg)
      return false
    }
  }, [member])

  const disable = useCallback(async () => {
    if (!member) return
    setError(null)
    await deleteDoc(doc(db, 'fcm-tokens', getDeviceId()))
    setEnabled(false)
  }, [member])

  return { enabled, loading, error, enable, disable }
}
