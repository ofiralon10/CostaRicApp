import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../context/LanguageContext'
import { itinerary } from '../data/itinerary'
import { hotels } from '../data/hotels'

// Real 3-day forecast (today + next 2), each for the place visited that day.
// Data: Open-Meteo (https://open-meteo.com) — free, keyless, CORS-ok. Forecast
// horizon is ~16 days, which comfortably covers "today + 2" during the trip.

interface DayCard {
  date: string        // YYYY-MM-DD
  label: string       // English location
  labelHe: string     // Hebrew location
  lat: number
  lon: number
}

interface DayWx {
  code: number
  tmax: number
  tmin: number
  pop: number | null  // max precipitation probability %
}

// A few day-trip days are far from where the family sleeps — point the forecast
// at the place actually visited rather than the hotel.
const COORD_OVERRIDES: Record<string, [number, number]> = {
  '2026-07-28': [10.77, -85.35], // Rincón de la Vieja NP (staying near Rio Celeste)
  '2026-08-03': [8.65, -83.73],  // Corcovado NP – San Pedrillo (staying in Uvita)
  '2026-08-06': [9.9937, -84.2043], // SJO / Alajuela — departure day (no hotel)
  '2026-08-10': [40.4168, -3.7038], // Madrid — fly-home day (no hotel)
}

function hotelCoords(hotelId?: string): [number, number] | null {
  if (!hotelId) return null
  const h = hotels.find(x => x.id === hotelId)
  return h ? h.coordinates : null
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

// WMO weather interpretation codes → emoji + label
function wxMeta(code: number): { emoji: string; he: string; en: string } {
  if (code === 0) return { emoji: '☀️', he: 'בהיר', en: 'Clear' }
  if (code === 1) return { emoji: '🌤️', he: 'בהיר בעיקר', en: 'Mostly clear' }
  if (code === 2) return { emoji: '⛅', he: 'מעונן חלקית', en: 'Partly cloudy' }
  if (code === 3) return { emoji: '☁️', he: 'מעונן', en: 'Overcast' }
  if (code === 45 || code === 48) return { emoji: '🌫️', he: 'ערפל', en: 'Fog' }
  if (code >= 51 && code <= 57) return { emoji: '🌦️', he: 'טפטוף', en: 'Drizzle' }
  if (code >= 61 && code <= 67) return { emoji: '🌧️', he: 'גשם', en: 'Rain' }
  if (code >= 71 && code <= 77) return { emoji: '🌨️', he: 'שלג', en: 'Snow' }
  if (code >= 80 && code <= 82) return { emoji: '🌦️', he: 'ממטרים', en: 'Showers' }
  if (code === 85 || code === 86) return { emoji: '🌨️', he: 'ממטרי שלג', en: 'Snow showers' }
  if (code >= 95) return { emoji: '⛈️', he: 'סופת רעמים', en: 'Thunderstorm' }
  return { emoji: '🌡️', he: 'מזג אוויר', en: 'Weather' }
}

export default function WeatherForecast() {
  const { t, lang } = useLang()
  const [wx, setWx] = useState<Record<string, DayWx | null>>({})
  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading')

  const now = new Date()
  const todayStr = ymd(now)
  const tomorrowStr = ymd(addDays(now, 1))

  const cards = useMemo<DayCard[]>(() => {
    const dayFor = (dateStr: string) => itinerary.find(d => d.date === dateStr)
    const toCard = (d: (typeof itinerary)[number]): DayCard | null => {
      const coords = COORD_OVERRIDES[d.date] ?? hotelCoords(d.hotelId)
      if (!coords) return null
      return { date: d.date, label: d.location, labelHe: d.locationHe, lat: coords[0], lon: coords[1] }
    }

    // Today + next 2 calendar days, mapped to their itinerary day.
    let picked = [0, 1, 2]
      .map(o => dayFor(ymd(addDays(now, o))))
      .filter((d): d is (typeof itinerary)[number] => Boolean(d))

    // Before the trip starts, preview the first 3 days instead.
    if (picked.length === 0) {
      const firstDate = itinerary[0].date
      if (todayStr < firstDate) picked = itinerary.slice(0, 3)
    }

    return picked.map(toCard).filter((c): c is DayCard => Boolean(c))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr])

  useEffect(() => {
    if (cards.length === 0) return
    let cancelled = false
    const load = async () => {
      setStatus('loading')
      try {
        const results = await Promise.all(cards.map(async c => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
            `&timezone=auto&start_date=${c.date}&end_date=${c.date}`
          const res = await fetch(url)
          const data = await res.json()
          const d = data?.daily
          if (!d || !Array.isArray(d.weather_code) || d.weather_code.length === 0) return [c.date, null] as const
          const wxDay: DayWx = {
            code: d.weather_code[0],
            tmax: d.temperature_2m_max[0],
            tmin: d.temperature_2m_min[0],
            pop: d.precipitation_probability_max?.[0] ?? null,
          }
          return [c.date, wxDay] as const
        }))
        if (cancelled) return
        const map: Record<string, DayWx | null> = {}
        for (const [date, day] of results) map[date] = day
        setWx(map)
        setStatus(Object.values(map).some(Boolean) ? 'ok' : 'offline')
      } catch {
        if (!cancelled) setStatus('offline')
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.map(c => c.date + c.lat).join(',')])

  if (cards.length === 0) return null

  const dayLabel = (date: string) => {
    if (date === todayStr) return t('היום', 'Today')
    if (date === tomorrowStr) return t('מחר', 'Tomorrow')
    const d = new Date(date + 'T12:00:00')
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' })
  }
  const dateNum = (date: string) => {
    const d = new Date(date + 'T12:00:00')
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="wx-card">
      <div className="wx-header">
        <span className="wx-title">🌦️ {t('מזג אוויר', 'Weather')}</span>
        {status === 'offline' && <span className="wx-offline">{t('לא זמין כרגע', 'Unavailable')}</span>}
      </div>
      <div className="wx-row">
        {cards.map(c => {
          const day = wx[c.date]
          const meta = day ? wxMeta(day.code) : null
          return (
            <div key={c.date} className="wx-day">
              <span className="wx-day-name">{dayLabel(c.date)}</span>
              <span className="wx-day-date">{dateNum(c.date)}</span>
              <span className="wx-place">{t(c.labelHe, c.label)}</span>
              {status === 'loading' && <span className="wx-emoji wx-dim">⏳</span>}
              {day && meta ? (
                <>
                  <span className="wx-emoji" title={t(meta.he, meta.en)}>{meta.emoji}</span>
                  <span className="wx-temp">
                    <strong>{Math.round(day.tmax)}°</strong>
                    <span className="wx-temp-min">{Math.round(day.tmin)}°</span>
                  </span>
                  <span className="wx-cond">{t(meta.he, meta.en)}</span>
                  {day.pop != null && day.pop >= 10 && (
                    <span className="wx-rain">💧 {day.pop}%</span>
                  )}
                </>
              ) : status !== 'loading' ? (
                <span className="wx-emoji wx-dim">—</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
