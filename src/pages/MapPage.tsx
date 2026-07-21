import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLang } from '../context/LanguageContext'
import { destinations } from '../data/destinations'
import { hotels } from '../data/hotels'
import { Layers } from 'lucide-react'

type FilterMode = 'hotels' | 'adventures'

function makeNumberIcon(num: number, color: string) {
  return new L.DivIcon({
    className: 'map-numbered-marker',
    html: `<div class="marker-num" style="background:${color}">${num}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function makeEmojiIcon(emoji: string) {
  return new L.DivIcon({
    className: 'map-numbered-marker',
    html: `<div class="marker-emoji">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useMemo(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])))
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [coords, map])
  return null
}

export default function MapPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterMode>('hotels')

  const costaRicaHotels = hotels.filter(h => h.region !== 'Madrid')
  const hotelCoords: [number, number][] = costaRicaHotels.map(h => [h.coordinates[0], h.coordinates[1]])
  const crDestinations = destinations.filter(d => d.id !== 'madrid')
  const destCoords: [number, number][] = crDestinations.map(d => [d.coordinates[0], d.coordinates[1]])

  const routeCoords = filter === 'hotels' ? hotelCoords : destCoords
  const allCoords = [...hotelCoords, ...destCoords]
  const center: [number, number] = allCoords.length > 0
    ? [
        allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
        allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
      ]
    : [10.0, -84.0]

  return (
    <div className="map-page-v2">
      <h2 className="page-title">{t('🗺️ מפת המסע', '🗺️ Journey Map')}</h2>
      <p className="map-subtitle">
        {t('כל לינה וכל הרפתקה, מההרים ועד האיים.', 'Every stay and every adventure, from mountains to coasts.')}
      </p>

      <div className="map-filters">
        <button className="map-layers-icon"><Layers size={18} /></button>
        <button
          className={`map-filter-btn ${filter === 'adventures' ? 'active' : ''}`}
          onClick={() => setFilter('adventures')}
        >
          {t(`הרפתקאות · ${crDestinations.length}`, `Adventures · ${crDestinations.length}`)}
        </button>
        <button
          className={`map-filter-btn ${filter === 'hotels' ? 'active' : ''}`}
          onClick={() => setFilter('hotels')}
        >
          {t(`מלונות · ${costaRicaHotels.length}`, `Hotels · ${costaRicaHotels.length}`)}
        </button>
      </div>

      <p className="map-tap-hint">{t('הקישו על סיכה לפתוח אותה', 'Tap a pin to open it')}</p>

      <div className="map-container-wrap">
        <MapContainer
          center={center}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '16px' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='<a href="https://leafletjs.com">Leaflet</a> | Tiles &copy; Esri &mdash; National Geographic'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
          />

          <FitBounds coords={routeCoords} />

          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#e8590c',
              weight: 3,
              dashArray: '10, 8',
              opacity: 0.8,
            }}
          />

          {filter === 'hotels' && costaRicaHotels.map((hotel, i) => (
            <Marker
              key={hotel.id}
              position={[hotel.coordinates[0], hotel.coordinates[1]]}
              icon={makeNumberIcon(i + 1, '#e8590c')}
            >
              <Popup className="map-popup">
                <div
                  className="popup-content popup-clickable"
                  onClick={() => navigate('/hotels', { state: { scrollTo: hotel.id } })}
                >
                  <div className="popup-number">{i + 1}</div>
                  <div className="popup-info">
                    <strong>{hotel.name}</strong>
                    <span className="popup-location">{hotel.location}</span>
                    <span className="popup-dates">{hotel.nights} {t(hotel.nights === 1 ? 'לילה' : 'לילות', hotel.nights === 1 ? 'night' : 'nights')}</span>
                    <span className="popup-go-hint">{t('לחצו לפרטים ←', 'Tap for details →')}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {filter === 'adventures' && crDestinations.map((dest) => (
            <Marker
              key={dest.id}
              position={[dest.coordinates[0], dest.coordinates[1]]}
              icon={makeEmojiIcon(dest.image)}
            >
              <Popup className="map-popup">
                <div
                  className="popup-content popup-clickable"
                  onClick={() => navigate('/destinations', { state: { scrollTo: dest.id } })}
                >
                  <span className="popup-emoji">{dest.image}</span>
                  <div className="popup-info">
                    <strong>{t(dest.nameHe, dest.name)}</strong>
                    <span className="popup-days">
                      {t(`ימים ${dest.days.join(', ')}`, `Days ${dest.days.join(', ')}`)}
                    </span>
                    <span className="popup-go-hint">{t('לחצו לפרטים ←', 'Tap for details →')}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-stop-list">
        {filter === 'hotels' ? (
          costaRicaHotels.map((hotel, i) => (
            <button
              key={hotel.id}
              className="map-stop-card"
              onClick={() => navigate('/hotels', { state: { scrollTo: hotel.id } })}
            >
              <div className="map-stop-num">{i + 1}</div>
              <div className="map-stop-info">
                <span className="map-stop-name">{hotel.name}</span>
                <span className="map-stop-sub">{hotel.location} · {hotel.nights} {t(hotel.nights === 1 ? 'לילה' : 'לילות', hotel.nights === 1 ? 'night' : 'nights')}</span>
              </div>
            </button>
          ))
        ) : (
          crDestinations.map(dest => (
            <button
              key={dest.id}
              className="map-stop-card"
              onClick={() => navigate('/destinations', { state: { scrollTo: dest.id } })}
            >
              <div className="map-stop-emoji">{dest.image}</div>
              <div className="map-stop-info">
                <span className="map-stop-name">{t(dest.nameHe, dest.name)}</span>
                <span className="map-stop-sub">
                  {t(`ימים ${dest.days.join(', ')}`, `Days ${dest.days.join(', ')}`)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
