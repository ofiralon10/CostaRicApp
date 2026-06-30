import { useMemo } from 'react'
import { differenceInDays, differenceInHours, differenceInMinutes, format, isAfter, isBefore, parseISO } from 'date-fns'
import { Plane, MapPin, Hotel, Sun } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { itinerary } from '../data/itinerary'
import { hotels } from '../data/hotels'

const DEPARTURE = '2026-07-23T05:30:00+03:00'
const TRIP_END = '2026-08-10T22:50:00+03:00'

export default function HomePage() {
  const { t } = useLang()
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

  const today = useMemo(() => {
    if (status !== 'during') return null
    const todayStr = format(now, 'yyyy-MM-dd')
    return itinerary.find(d => d.date === todayStr) || itinerary.find(d => {
      const dayDate = parseISO(d.date)
      return differenceInDays(now, dayDate) >= 0 && differenceInDays(now, dayDate) < 1
    })
  }, [status, now])

  const todayHotel = useMemo(() => {
    if (!today?.hotelId) return null
    return hotels.find(h => h.id === today.hotelId)
  }, [today])

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-bg" />
        <div className="hero-content">
          <h2 className="hero-title">
            {t('🌴 ההרפתקה בקוסטה ריקה', '🌴 Costa Rica Adventure')}
          </h2>
          <p className="hero-subtitle">
            {t('23 ביולי – 10 באוגוסט 2026', 'July 23 – August 10, 2026')}
          </p>
        </div>
      </div>

      {status === 'before' && countdown && (
        <div className="countdown-card">
          <Plane className="countdown-icon" size={28} />
          <h3>{t('ממריאים בעוד', 'Taking off in')}</h3>
          <div className="countdown-grid">
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.days}</span>
              <span className="countdown-label">{t('ימים', 'days')}</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.hours}</span>
              <span className="countdown-label">{t('שעות', 'hours')}</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number">{countdown.minutes}</span>
              <span className="countdown-label">{t('דקות', 'min')}</span>
            </div>
          </div>
        </div>
      )}

      {status === 'during' && today && (
        <div className="today-card">
          <div className="today-header">
            <Sun size={24} />
            <h3>{t(`יום ${today.day}`, `Day ${today.day}`)}</h3>
          </div>
          <div className="today-info">
            <div className="today-row">
              <MapPin size={18} />
              <span>{t(today.locationHe, today.location)}</span>
            </div>
            {todayHotel && (
              <div className="today-row">
                <Hotel size={18} />
                <span>{todayHotel.name}</span>
              </div>
            )}
          </div>
          {today.activities.length > 0 && (
            <div className="today-activities">
              <h4>{t('תוכנית להיום', "Today's Plan")}</h4>
              {today.activities.map(a => (
                <div key={a.id} className="today-activity">
                  <span className="activity-dot" />
                  <span>{t(a.nameHe, a.name)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'after' && (
        <div className="memory-card">
          <h3>{t('🎉 חזרנו! איזה טיול מדהים', '🎉 We\'re back! What an amazing trip')}</h3>
        </div>
      )}

      <div className="quick-stats">
        <div className="stat-card">
          <span className="stat-number">19</span>
          <span className="stat-label">{t('ימים', 'Days')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">9</span>
          <span className="stat-label">{t('מלונות', 'Hotels')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">8</span>
          <span className="stat-label">{t('יעדים', 'Destinations')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">4</span>
          <span className="stat-label">{t('טיסות', 'Flights')}</span>
        </div>
      </div>
    </div>
  )
}
