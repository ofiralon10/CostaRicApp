import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { MapPin, Car, ChevronDown, ChevronUp, DollarSign, ExternalLink } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { itinerary } from '../data/itinerary'
import { hotels } from '../data/hotels'

export default function ItineraryPage() {
  const { t, lang } = useLang()
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  const toggle = (day: number) => setExpandedDay(prev => (prev === day ? null : day))

  const regionColors: Record<string, string> = {
    'San José': '#2563eb',
    'Arenal': '#dc2626',
    'Rio Celeste': '#0891b2',
    'Rincón de la Vieja': '#ea580c',
    'Monteverde': '#16a34a',
    'Manuel Antonio': '#eab308',
    'Uvita': '#7c3aed',
    'San Gerardo de Dota': '#059669',
    'Departure': '#64748b',
    'Madrid': '#be123c',
    'Home': '#64748b',
  }

  return (
    <div className="itinerary-page">
      <h2 className="page-title">{t('מסלול הטיול', 'Trip Itinerary')}</h2>

      <div className="timeline">
        {itinerary.map(day => {
          const isExpanded = expandedDay === day.day
          const hotel = day.hotelId ? hotels.find(h => h.id === day.hotelId) : null
          const dateStr = format(parseISO(day.date), lang === 'he' ? 'EEEE, d MMMM' : 'EEE, MMM d', {
            locale: lang === 'he' ? he : undefined,
          })
          const color = regionColors[day.region] || '#64748b'

          return (
            <div key={day.day} className="timeline-item" onClick={() => toggle(day.day)}>
              <div className="timeline-marker" style={{ backgroundColor: color }} />
              <div className="timeline-line" />

              <div className={`day-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="day-header">
                  <div className="day-header-left">
                    <span className="day-badge" style={{ backgroundColor: color }}>
                      {t(`יום ${day.day}`, `Day ${day.day}`)}
                    </span>
                    <div className="day-header-text">
                      <span className="day-location">{t(day.locationHe, day.location)}</span>
                      <span className="day-date">{dateStr}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {isExpanded && (
                  <div className="day-details">
                    {day.drivingDistance && (
                      <div className="driving-info">
                        <Car size={16} />
                        <span>{day.drivingDistance}</span>
                      </div>
                    )}

                    {day.activities.length > 0 && (
                      <div className="activities-list">
                        {day.activities.map(a => (
                          <div key={a.id} className="activity-item">
                            <div className="activity-header">
                              <span className="activity-name">{t(a.nameHe, a.name)}</span>
                              {a.mapsUrl && (
                                <a
                                  href={a.mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="maps-link"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <MapPin size={14} />
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            {a.description && (
                              <span className="activity-desc">{t(a.descriptionHe || a.description, a.description)}</span>
                            )}
                            {(a.costPerPerson || a.costTotal) && (
                              <span className="activity-cost">
                                <DollarSign size={12} />
                                {a.costPerPerson
                                  ? t(`$${a.costPerPerson} לאדם`, `$${a.costPerPerson}/person`)
                                  : t(`$${a.costTotal} סה"כ`, `$${a.costTotal} total`)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {hotel && day.checkIn && (
                      <div className="hotel-badge">
                        <span className="hotel-badge-icon">🏨</span>
                        <div>
                          <span className="hotel-badge-name">{hotel.name}</span>
                          <span className="hotel-badge-detail">
                            {t(`${hotel.nights} לילות · ארוחת בוקר כלולה`, `${hotel.nights} night${hotel.nights > 1 ? 's' : ''} · Breakfast included`)}
                          </span>
                        </div>
                      </div>
                    )}

                    {(day.notes || day.notesHe) && (
                      <div className="day-notes">
                        💡 {t(day.notesHe || day.notes || '', day.notes || '')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
