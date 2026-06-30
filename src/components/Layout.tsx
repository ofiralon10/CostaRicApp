import { Outlet, NavLink } from 'react-router-dom'
import { Home, CalendarDays, Map, Hotel, Compass, Phone, Globe } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🇨🇷 {t('קוסטה ריקה', 'Costa Rica')} 2026</h1>
        <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
          <Globe size={18} />
          <span>{lang === 'he' ? 'EN' : 'עב'}</span>
        </button>
      </header>

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
