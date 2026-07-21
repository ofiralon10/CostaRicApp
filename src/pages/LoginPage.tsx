import { useAuth, familyMembers } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useState } from 'react'

export default function LoginPage() {
  const { loginWithGoogle, loading } = useAuth()
  const { t } = useLang()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleLogin = async () => {
    setError(null)
    setSigningIn(true)
    const result = await loginWithGoogle()
    setSigningIn(false)
    if (result.error === 'notAllowed') {
      setError(t('החשבון הזה לא שייך למשפחה 🙅', 'This account is not part of the family 🙅'))
    } else if (result.error) {
      setError(t('ההתחברות נכשלה, נסו שוב', 'Sign-in failed, try again'))
    }
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="loading-screen">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/images/hero-costa-rica.jpg" alt="Costa Rica" className="login-hero" />
        <h1>🇨🇷 Costa Rica 2026</h1>
        <p className="login-subtitle">{t('המסע של משפחת אלון', "The Alon Family Adventure")}</p>

        <div className="family-avatars">
          {familyMembers.map(m => (
            <div key={m.id} className="family-avatar-item">
              <img src={m.avatar} alt={m.nameEn} className="family-avatar-img" />
              <span className="family-avatar-name">{m.name}</span>
            </div>
          ))}
        </div>

        <button
          className="google-btn"
          onClick={handleLogin}
          disabled={signingIn}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {signingIn
            ? t('מתחבר...', 'Signing in...')
            : t('התחברות עם Google', 'Sign in with Google')}
        </button>
        {error && <p className="pin-error">{error}</p>}
      </div>
    </div>
  )
}
