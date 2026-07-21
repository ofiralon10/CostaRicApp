import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export type UserRole = 'parent' | 'kid'

interface FamilyMember {
  id: string
  name: string
  nameEn: string
  emoji: string
  avatar: string
  role: UserRole
  email: string
}

export const familyMembers: FamilyMember[] = [
  { id: 'yoav', name: 'יואב', nameEn: 'Yoav', emoji: '🧒', avatar: '/images/avatar-yoav.jpg', role: 'kid', email: 'yoav.alon333@gmail.com' },
  { id: 'matan', name: 'מתן', nameEn: 'Matan', emoji: '👦', avatar: '/images/avatar-matan.jpg', role: 'kid', email: 'matan.alon333@gmail.com' },
  { id: 'ofir', name: 'אופיר', nameEn: 'Ofir', emoji: '👨', avatar: '/images/avatar-ofir.jpg', role: 'parent', email: 'ofiralon10@gmail.com' },
  { id: 'merav', name: 'מירב', nameEn: 'Merav', emoji: '👩', avatar: '/images/avatar-merav.jpg', role: 'parent', email: 'merav.yanai@gmail.com' },
  { id: 'maya', name: 'מאיה', nameEn: 'Maya', emoji: '👩‍🦱', avatar: '/images/avatar-maya.jpg', role: 'kid', email: 'mayalon03@gmail.com' },
]

const ALLOWED_EMAILS = new Set(familyMembers.map(m => m.email))

interface AuthContextType {
  member: FamilyMember | null
  role: UserRole | null
  isParent: boolean
  firebaseUser: User | null
  loading: boolean
  loginWithGoogle: () => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      if (user?.email && ALLOWED_EMAILS.has(user.email)) {
        setMember(familyMembers.find(m => m.email === user.email) || null)
      } else {
        setMember(null)
      }
      setLoading(false)
    })
  }, [])

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const email = result.user.email
      if (!email || !ALLOWED_EMAILS.has(email)) {
        await signOut(auth)
        return { error: 'notAllowed' }
      }
      return {}
    } catch {
      return { error: 'failed' }
    }
  }

  const logout = async () => {
    await signOut(auth)
    setMember(null)
    setFirebaseUser(null)
  }

  return (
    <AuthContext.Provider value={{
      member,
      role: member?.role || null,
      isParent: member?.role === 'parent',
      firebaseUser,
      loading,
      loginWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
