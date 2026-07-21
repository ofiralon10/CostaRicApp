import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Home, CalendarDays, Map, Hotel, Compass, Phone, Globe, LogOut, X } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { APP_VERSION } from '../version'

const navItems = [
  { to: '/', icon: Home, labelHe: 'בית', labelEn: 'Home' },
  { to: '/itinerary', icon: CalendarDays, labelHe: 'מסלול', labelEn: 'Plan' },
  { to: '/map', icon: Map, labelHe: 'מפה', labelEn: 'Map' },
  { to: '/hotels', icon: Hotel, labelHe: 'מלונות', labelEn: 'Hotels' },
  { to: '/destinations', icon: Compass, labelHe: 'יעדים', labelEn: 'Explore' },
  { to: '/emergency', icon: Phone, labelHe: 'חירום', labelEn: 'SOS' },
]

export default function Layout() {
  const { t, toggleLang, lang } = useLang()
  const { member, logout } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title-wrap">
          <h1 className="app-title">🇨🇷 {t('קוסטה ריקה', 'Costa Rica')} 2026</h1>
          <span className="app-version">v{APP_VERSION}</span>
        </div>
        <div className="header-actions">
          {member && (
            <img
              className="user-badge-avatar"
              src={member.avatar}
              alt={member.nameEn}
              title={member.nameEn}
              onClick={() => setShowProfile(true)}
              style={{ cursor: 'pointer' }}
            />
          )}
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            <Globe size={18} />
            <span>{lang === 'he' ? 'EN' : 'עב'}</span>
          </button>
          {member && (
            <button className="lang-toggle" onClick={() => { logout() }} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {showProfile && member && (
        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <img className="profile-modal-avatar" src={member.avatar} alt={member.nameEn} />
            <h2 className="profile-modal-greeting">
              {t(`היי, ${member.name}!`, `Hi, ${member.nameEn}!`)} {member.emoji}
            </h2>
            <button className="game-btn" onClick={() => setShowProfile(false)}>
              <X size={16} /> {t('סגור', 'Close')}
            </button>
          </div>
        </div>
      )}

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, labelHe, labelEn }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{t(labelHe, labelEn)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
