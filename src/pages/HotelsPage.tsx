import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { MapPin, Calendar, Bed, Coffee, ExternalLink } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { hotels as defaultHotels } from '../data/hotels'
import { flights as defaultFlights } from '../data/flights'
import type { Flight, Hotel } from '../data/types'

export default function HotelsPage() {
  const { t, lang } = useLang()
  const { isParent } = useAuth()
  const [storedFlights] = useSharedState<Flight[] | null>('flights', null)
  const [storedHotels] = useSharedState<Hotel[] | null>('hotels', null)
  const flights = storedFlights ?? defaultFlights
  const hotels = storedHotels ?? defaultHotels
  const location = useLocation()
  const scrollTarget = (location.state as { scrollTo?: string } | null)?.scrollTo
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (scrollTarget && cardRefs.current[scrollTarget]) {
      setTimeout(() => {
        cardRefs.current[scrollTarget]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [scrollTarget])

  const formatDate = (d: string) =>
    format(parseISO(d), lang === 'he' ? 'd MMM' : 'MMM d', { locale: lang === 'he' ? he : undefined })

  return (
    <div className="hotels-page">
      <h2 className="page-title">{t('טיסות', 'Flights')}</h2>
      <div className="flights-list">
        {flights.map(f => (
          <div key={f.id} className="flight-card">
            <div className="flight-route" dir="ltr">
              <span className="flight-city">{f.from}</span>
              <div className="flight-arrow">
                <span className="flight-line" />
                ✈️
              </div>
              <span className="flight-city">{f.to}</span>
            </div>
            <div className="flight-details">
              <span>{formatDate(f.date)}</span>
              <span dir="ltr">{f.departure} → {f.arrival}</span>
              <span className="flight-number">{f.airline} {f.flightNumber}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="page-title" style={{ marginTop: '2rem' }}>{t('מלונות', 'Hotels')}</h2>
      <div className="hotels-list">
        {hotels.map(h => (
          <div key={h.id} ref={el => { cardRefs.current[h.id] = el }} className={`hotel-card ${scrollTarget === h.id ? 'highlighted' : ''}`}>
            <div className="hotel-header">
              <h3 className="hotel-name">{h.name}</h3>
              <span className="hotel-region-badge">{h.region}</span>
            </div>

            <div className="hotel-info-grid">
              <div className="hotel-info-row">
                <MapPin size={16} />
                <span>{h.location}</span>
              </div>
              <div className="hotel-info-row">
                <Calendar size={16} />
                <span className="hotel-dates">
                  <bdi>{formatDate(h.checkIn)}</bdi>
                  <span className="hotel-dates-sep">{lang === 'he' ? '←' : '→'}</span>
                  <bdi>{formatDate(h.checkOut)}</bdi>
                </span>
                <span className="nights-badge">
                  {t(`${h.nights} ${h.nights === 1 ? 'לילה' : 'לילות'}`, `${h.nights} night${h.nights > 1 ? 's' : ''}`)}
                </span>
              </div>
              <div className="hotel-info-row">
                <Bed size={16} />
                <span>{h.rooms}</span>
              </div>
              {h.breakfast && (
                <div className="hotel-info-row">
                  <Coffee size={16} />
                  <span>{t('ארוחת בוקר כלולה', 'Breakfast included')}</span>
                </div>
              )}
            </div>

            <div className="hotel-footer">
              {isParent && <span className="hotel-cost">${h.cost.toLocaleString()}</span>}
              <a
                href={`https://maps.google.com/?q=${h.coordinates[0]},${h.coordinates[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hotel-map-link"
              >
                <MapPin size={14} />
                {t('נווט', 'Navigate')}
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
