import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useSharedState<T>(docId: string, defaultValue: T): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(true)
  const localWrite = useRef(false)

  useEffect(() => {
    const ref = doc(db, 'shared', docId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setValue(snap.data().value as T)
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsub
  }, [docId])

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    localWrite.current = true
    setValue(prev => {
      const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
      const ref = doc(db, 'shared', docId)
      setDoc(ref, { value: next }, { merge: false })
      return next
    })
  }, [docId])

  return [value, update, loading]
}
