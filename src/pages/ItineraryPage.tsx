import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { MapPin, Car, ChevronDown, ChevronUp, DollarSign, ExternalLink, CheckCircle2, Circle } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { itinerary as defaultItinerary } from '../data/itinerary'
import { hotels } from '../data/hotels'
import { useSharedState } from '../hooks/useSharedState'

export default function ItineraryPage() {
  const { t, lang } = useLang()
  const { isParent } = useAuth()
  const location = useLocation()
  const scrollTarget = (location.state as { scrollTo?: number })?.scrollTo ?? null
  const [expandedDay, setExpandedDay] = useState<number | null>(scrollTarget)
  // We intentionally use the built-in itinerary and do NOT read shared/itinerary.
  // The AI chat backend (Cloud Functions) still holds a stale itinerary copy, so any
  // AI itinerary edit overwrites shared/itinerary with outdated data (wiping the Madrid
  // plan). Reading only the built-in file makes the displayed itinerary immune to that.
  // Re-enable the shared read once functions are redeployed with the synced
  // functions/itinerary.js (see CLAUDE.md → pending functions deploy).
  const itinerary = defaultItinerary
  // Family-shared "done" state — checking off an activity syncs to everyone.
  const [doneMap, setDoneMap] = useSharedState<Record<string, boolean>>('activity-done', {})
  const dayRefs = useRef<Record<number, HTMLElement | null>>({})

  const toggleDone = (id: string) =>
    setDoneMap(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })

  useEffect(() => {
    if (scrollTarget && dayRefs.current[scrollTarget]) {
      dayRefs.current[scrollTarget]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [scrollTarget])

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
          const totalActs = day.activities.length
          const doneActs = day.activities.filter(a => doneMap[a.id]).length
          const allDone = totalActs > 0 && doneActs === totalActs

          return (
            <div key={day.day} className="timeline-item" ref={el => { dayRefs.current[day.day] = el }} onClick={() => toggle(day.day)}>
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
                  <div className="day-header-right">
                    {totalActs > 0 && (
                      <span className={`day-progress ${allDone ? 'done' : ''}`}>
                        {allDone ? <CheckCircle2 size={13} /> : null}
                        {doneActs}/{totalActs}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
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
                        {day.activities.map(a => {
                          const isDone = !!doneMap[a.id]
                          return (
                          <div key={a.id} className={`activity-item ${isDone ? 'done' : ''}`}>
                            <button
                              className={`activity-check ${isDone ? 'checked' : ''}`}
                              onClick={e => { e.stopPropagation(); toggleDone(a.id) }}
                              aria-label={isDone ? t('בטל סימון', 'Mark not done') : t('סמן כבוצע', 'Mark done')}
                              aria-pressed={isDone}
                            >
                              {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                            </button>
                            <div className="activity-body">
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
                              {isParent && (a.costPerPerson || a.costTotal) && (
                                <span className="activity-cost">
                                  <DollarSign size={12} />
                                  {a.costPerPerson
                                    ? t(`$${a.costPerPerson} לאדם`, `$${a.costPerPerson}/person`)
                                    : t(`$${a.costTotal} סה"כ`, `$${a.costTotal} total`)}
                                </span>
                              )}
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}

                    {hotel && day.checkIn && (
                      <div className="hotel-badge">
                        <span className="hotel-badge-icon">🏨</span>
                        <div>
                          <span className="hotel-badge-name">{hotel.name}</span>
                          <span className="hotel-badge-detail">
                            {t(`${hotel.nights} ${hotel.nights === 1 ? 'לילה' : 'לילות'} · ארוחת בוקר כלולה`, `${hotel.nights} night${hotel.nights > 1 ? 's' : ''} · Breakfast included`)}
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
