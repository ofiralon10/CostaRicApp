import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { MapPin, Calendar, Bed, Coffee, ExternalLink } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { hotels } from '../data/hotels'
import { flights } from '../data/flights'

export default function HotelsPage() {
  const { t, lang } = useLang()

  const formatDate = (d: string) =>
    format(parseISO(d), lang === 'he' ? 'd MMM' : 'MMM d', { locale: lang === 'he' ? he : undefined })

  return (
    <div className="hotels-page">
      <h2 className="page-title">{t('טיסות', 'Flights')}</h2>
      <div className="flights-list">
        {flights.map(f => (
          <div key={f.id} className="flight-card">
            <div className="flight-route">
              <span className="flight-city">{f.from}</span>
              <div className="flight-arrow">
                <span className="flight-line" />
                ✈️
              </div>
              <span className="flight-city">{f.to}</span>
            </div>
            <div className="flight-details">
              <span>{formatDate(f.date)}</span>
              <span>{f.departure} → {f.arrival}</span>
              <span className="flight-number">{f.airline} {f.flightNumber}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="page-title" style={{ marginTop: '2rem' }}>{t('מלונות', 'Hotels')}</h2>
      <div className="hotels-list">
        {hotels.map(h => (
          <div key={h.id} className="hotel-card">
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
                <span>{formatDate(h.checkIn)} → {formatDate(h.checkOut)}</span>
                <span className="nights-badge">
                  {t(`${h.nights} לילות`, `${h.nights} night${h.nights > 1 ? 's' : ''}`)}
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
              <span className="hotel-cost">${h.cost.toLocaleString()}</span>
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
