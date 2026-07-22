import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore } from 'date-fns'
import { useLang } from '../context/LanguageContext'
import { destinations } from '../data/destinations'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../context/AuthContext'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

const DEPARTURE = '2026-07-23T05:00:00+03:00'
const TRIP_END = '2026-08-11T04:25:00+03:00'

const NAV_CARDS = [
  { id: 'itinerary', label: 'מסלול', labelEn: 'Itinerary', path: '/itinerary', image: '/images/nav-destinations.jpg' },
  { id: 'flights', label: 'טיסות ומלונות', labelEn: 'Flights & Hotels', path: '/hotels', image: '/images/nav-flights.jpg' },
  { id: 'destinations', label: 'יעדים', labelEn: 'Destinations', path: '/destinations', image: '/images/nav-activities.jpg' },
  { id: 'games', label: 'משחקים', labelEn: 'Games', path: '/games', image: '/images/nav-games.jpg', emoji: '🎮' },
  { id: 'achievements', label: 'מדבקות', labelEn: 'Stickers', path: '/achievements', image: '/images/nav-stickers.jpg', emoji: '🏆' },
  { id: 'map', label: 'מפה', labelEn: 'Map', path: '/map', image: '/images/nav-weather.jpg' },
  { id: 'packing', label: 'ארוז', labelEn: 'Packing', path: '/packing', image: '/images/nav-stickers.jpg' },
  { id: 'currency', label: 'מטבעות', labelEn: 'Currency', path: '/currency', image: '/images/nav-flights.jpg' },
  { id: 'awards', label: 'פרסים', labelEn: 'Awards', path: '/awards', image: '/images/nav-awards.jpg' },
  { id: 'chat', label: 'מדריך AI', labelEn: 'AI Guide', path: '/chat', image: '/images/nav-chat.jpg' },
  { id: 'album', label: 'אלבום', labelEn: 'Album', path: '/album', image: '/images/nav-activities.jpg' },
  { id: 'documents', label: 'מסמכים', labelEn: 'Documents', path: '/documents', image: '/images/nav-destinations.jpg' },
  { id: 'emergency', label: 'חירום', labelEn: 'Emergency', path: '/emergency', image: '/images/nav-emergency.jpg' },
]

export default function HomePage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const { member } = useAuth()
  const { enabled: notifEnabled, loading: notifLoading, error: notifError, enable: enableNotif, disable: disableNotif } = useNotifications()
  const [testSent, setTestSent] = useState(false)
  const [podcastHidden, setPodcastHidden] = useState(() => localStorage.getItem('family-podcast-hidden') === '1')
  const hidePodcast = () => { localStorage.setItem('family-podcast-hidden', '1'); setPodcastHidden(true) }
  // Show the "podcast for the road" card only from Jul 23 (departure day) onward, until dismissed
  const showPodcast = !podcastHidden && new Date() >= new Date('2026-07-23T00:00:00+03:00')

  const sendTestNotif = async () => {
    if (!member) return
    try {
      const send = httpsCallable(functions, 'sendNotification')
      await send({ targetMemberIds: [member.id], title: 'Costa Rica 2026 🌴', body: t('ההתראות עובדות! 🎉', 'Notifications are working! 🎉') })
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch { /* ignore */ }
  }
  const now = new Date()
  const departureDate = new Date(DEPARTURE)
  const tripEnd = new Date(TRIP_END)

  const status = useMemo(() => {
    if (isBefore(now, departureDate)) return 'before' as const
    if (isAfter(now, tripEnd)) return 'after' as const
    return 'during' as const
  }, [now])

  const countdown = useMemo(() => {
    if (status !== 'before') return null
    const days = differenceInDays(departureDate, now)
    const hours = differenceInHours(departureDate, now) % 24
    const minutes = differenceInMinutes(departureDate, now) % 60
    return { days, hours, minutes }
  }, [status, now])

  return (
    <div className="home-page scrapbook">
      {/* Hero Title Section */}
      <div className="sb-hero">
        <img src="/images/hero-costa-rica.jpg" alt="Costa Rica" className="sb-hero-bg" />
        <div className="sb-hero-overlay" />
        <div className="sb-hero-content">
          <div className="sb-hero-frame">
            <h1 className="sb-title">
              {t('🌴 קוסטה ריקה', '🌴 Costa Rica')}
            </h1>
            <p className="sb-family">
              {t('המסע של משפחת אלון', 'The Alon Family Journey')}
            </p>
            <p className="sb-dates">
              {t('23 ביולי – 10 באוגוסט 2026', 'July 23 – August 10, 2026')}
            </p>
          </div>
        </div>
      </div>

      {/* Countdown Badge */}
      {status === 'before' && countdown && (
        <div className="sb-countdown">
          <div className="sb-countdown-inner">
            <span className="sb-countdown-text">
              {t('עוד', 'Only')}
            </span>
            <span className="sb-countdown-number">{countdown.days}</span>
            <span className="sb-countdown-text">
              {t('ימים עד קוסטה ריקה!', 'days until Costa Rica!')}
            </span>
          </div>
          <div className="sb-countdown-detail">
            <span>{countdown.hours} {t('שעות', 'hrs')}</span>
            <span>·</span>
            <span>{countdown.minutes} {t('דקות', 'min')}</span>
          </div>
        </div>
      )}

      {status === 'after' && (
        <div className="sb-countdown">
          <div className="sb-countdown-inner">
            <span className="sb-countdown-text">
              {t('🎉 חזרנו! איזה טיול מדהים', '🎉 We\'re back! What an amazing trip')}
            </span>
          </div>
        </div>
      )}

      {/* Notification Toggle */}
      {!notifLoading && (
        <div className="sb-notif-toggle">
          <span className="sb-notif-label">🔔 {t('התראות', 'Notifications')}</span>
          <div className="sb-notif-right">
            <span className={`sb-notif-status ${notifEnabled ? 'on' : ''}`}>
              {notifEnabled ? t('פעיל', 'On') : t('כבוי', 'Off')}
            </span>
            <label className="sb-notif-switch">
              <input
                type="checkbox"
                checked={!!notifEnabled}
                onChange={() => notifEnabled ? disableNotif() : enableNotif()}
              />
              <span className="sb-notif-track" />
              <span className="sb-notif-knob" />
            </label>
            {notifEnabled && (
              <button className="sb-notif-test" onClick={sendTestNotif}>
                {testSent ? '✓' : t('בדיקה', 'Test')}
              </button>
            )}
          </div>
          {notifError && <p className="sb-notif-error">{notifError}</p>}
        </div>
      )}

      {/* Family preparation podcast — appears from departure day (Jul 23) until dismissed */}
      {showPodcast && (
        <div className="sb-podcast-card">
          <div className="sb-podcast-top">
            <span className="sb-podcast-title">🎧 {t('פודקאסט לדרך', 'Podcast for the Road')}</span>
            <button className="sb-podcast-hide" onClick={hidePodcast}>{t('סיימנו להאזין ✕', 'Done listening ✕')}</button>
          </div>
          <p className="sb-podcast-sub">{t('שיחה משפחתית לפני המסע — האזינו יחד בדרך לשדה 🌴', 'A family talk before the trip — listen together on the way ✈️')}</p>
          <div className="sb-podcast-item">
            <span className="sb-podcast-label">{t('גרסה קצרה', 'Short version')} · 22 {t('דק׳', 'min')}</span>
            <audio className="sb-podcast-audio" controls preload="none" src="/audio/family-preparation-short.m4a" />
          </div>
          <div className="sb-podcast-item">
            <span className="sb-podcast-label">{t('גרסה ארוכה', 'Long version')} · 50 {t('דק׳', 'min')}</span>
            <audio className="sb-podcast-audio" controls preload="none" src="/audio/family-preparation.m4a" />
          </div>
        </div>
      )}

      {/* Navigation Grid */}
      <div className="sb-nav-grid">
        {NAV_CARDS.map(card => (
          <button
            key={card.id}
            className="sb-nav-card"
            onClick={() => navigate(card.path)}
          >
            <div className="sb-nav-img-wrap">
              <img src={card.image} alt={card.labelEn} loading="lazy" />
            </div>
            <span className="sb-nav-label">{t(card.label, card.labelEn)}</span>
          </button>
        ))}
      </div>

      {/* Destination Journey */}
      <h2 className="sb-section-title">{t('🗺️ תחנות המסע', '🗺️ Our Journey')}</h2>
      <div className="sb-journey">
        <div className="sb-journey-line" />
        {destinations.map((dest, i) => (
          <div
            key={dest.id}
            className={`sb-polaroid ${i % 2 === 0 ? 'tilt-left' : 'tilt-right'}`}
            onClick={() => navigate('/destinations')}
          >
            <div className="sb-polaroid-img">
              <img src={dest.imageUrl || ''} alt={dest.name} loading="lazy" />
            </div>
            <div className="sb-polaroid-label">
              <strong>{t(dest.nameHe, dest.name)}</strong>
              <span className="sb-polaroid-days">
                {t(
                  dest.days.length === 1
                    ? `היום ה-${dest.days[0]}`
                    : `ימים ${dest.days.join(', ')}`,
                  dest.days.length === 1
                    ? `Day ${dest.days[0]}`
                    : `Days ${dest.days.join(', ')}`
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
