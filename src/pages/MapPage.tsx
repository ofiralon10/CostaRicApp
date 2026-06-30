import { useLang } from '../context/LanguageContext'
import { destinations } from '../data/destinations'
import { hotels } from '../data/hotels'
import { MapPin, ExternalLink } from 'lucide-react'

export default function MapPage() {
  const { t } = useLang()

  const costaRicaHotels = hotels.filter(h => h.region !== 'Madrid')
  const madridHotels = hotels.filter(h => h.region === 'Madrid')

  const allPoints = costaRicaHotels.map(h => h.coordinates)
  const centerLat = allPoints.reduce((s, c) => s + c[0], 0) / allPoints.length
  const centerLng = allPoints.reduce((s, c) => s + c[1], 0) / allPoints.length

  const googleMapsUrl = `https://www.google.com/maps/dir/${costaRicaHotels.map(h => `${h.coordinates[0]},${h.coordinates[1]}`).join('/')}`

  return (
    <div className="map-page">
      <h2 className="page-title">{t('מפת המסלול', 'Route Map')}</h2>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="full-route-btn"
      >
        <MapPin size={18} />
        {t('פתח מסלול מלא ב-Google Maps', 'Open full route in Google Maps')}
        <ExternalLink size={14} />
      </a>

      <div className="route-stops">
        <h3>{t('🇨🇷 קוסטה ריקה', '🇨🇷 Costa Rica')}</h3>
        {costaRicaHotels.map((hotel, i) => (
          <a
            key={hotel.id}
            href={`https://maps.google.com/?q=${hotel.coordinates[0]},${hotel.coordinates[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="route-stop"
          >
            <div className="stop-number">{i + 1}</div>
            <div className="stop-connector" />
            <div className="stop-info">
              <span className="stop-name">{hotel.name}</span>
              <span className="stop-location">{hotel.location}</span>
              <span className="stop-dates">{hotel.nights} {t('לילות', 'nights')}</span>
            </div>
            <ExternalLink size={14} className="stop-link-icon" />
          </a>
        ))}

        <h3 style={{ marginTop: '1.5rem' }}>{t('🇪🇸 מדריד', '🇪🇸 Madrid')}</h3>
        {madridHotels.map(hotel => (
          <a
            key={hotel.id}
            href={`https://maps.google.com/?q=${hotel.coordinates[0]},${hotel.coordinates[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="route-stop"
          >
            <div className="stop-number">✈️</div>
            <div className="stop-info">
              <span className="stop-name">{hotel.name}</span>
              <span className="stop-location">{hotel.location}</span>
              <span className="stop-dates">{hotel.nights} {t('לילות', 'nights')}</span>
            </div>
            <ExternalLink size={14} className="stop-link-icon" />
          </a>
        ))}
      </div>

      <div className="destinations-map-list">
        <h3>{t('יעדים', 'Destinations')}</h3>
        {destinations.map(dest => (
          <a
            key={dest.id}
            href={`https://maps.google.com/?q=${dest.coordinates[0]},${dest.coordinates[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="dest-map-item"
          >
            <span className="dest-map-emoji">{dest.image}</span>
            <span className="dest-map-name">{t(dest.nameHe, dest.name)}</span>
            <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </div>
  )
}
