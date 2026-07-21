import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp, Sparkles, Star, Headphones, Play, Pause } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { destinations } from '../data/destinations'

export default function DestinationsPage() {
  const { t } = useLang()
  const location = useLocation()
  const scrollTarget = (location.state as { scrollTo?: string } | null)?.scrollTo
  const [expandedId, setExpandedId] = useState<string | null>(scrollTarget || null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (scrollTarget && cardRefs.current[scrollTarget]) {
      setTimeout(() => {
        cardRefs.current[scrollTarget]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [scrollTarget])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const togglePlay = (destId: string) => {
    const audio = audioRefs.current[destId]
    if (!audio) return

    if (playingId === destId) {
      audio.pause()
      setPlayingId(null)
    } else {
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]!.pause()
      }
      audio.play()
      setPlayingId(destId)
    }
  }

  return (
    <div className="destinations-page">
      <h2 className="page-title">{t('יעדים', 'Destinations')}</h2>

      <div className="destinations-grid">
        {destinations.map(dest => {
          const isExpanded = expandedId === dest.id
          return (
            <div
              key={dest.id}
              ref={el => { cardRefs.current[dest.id] = el }}
              className={`destination-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(prev => (prev === dest.id ? null : dest.id))}
            >
              {dest.imageUrl && (
                <div className="dest-image-wrapper">
                  <img src={dest.imageUrl} alt={dest.name} className="dest-image" loading="lazy" />
                </div>
              )}
              <div className="dest-header">
                <span className="dest-emoji">{dest.image}</span>
                <div className="dest-header-text">
                  <h3>{t(dest.nameHe, dest.name)}</h3>
                  <span className="dest-days">
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
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {isExpanded && (
                <div className="dest-details">
                  <p className="dest-description">{t(dest.descriptionHe, dest.description)}</p>

                  {dest.podcastUrl && (
                    <div className="dest-podcast" onClick={e => e.stopPropagation()}>
                      <h4><Headphones size={16} /> {t('פודקאסט', 'Podcast')}</h4>
                      <p className="podcast-subtitle">
                        {t(
                          `${dest.nameHe} · פודקאסט בעברית`,
                          `${dest.name} · Hebrew Podcast`
                        )}
                      </p>
                      <div className="podcast-player">
                        <button
                          className="podcast-play-btn"
                          onClick={() => togglePlay(dest.id)}
                        >
                          {playingId === dest.id ? <Pause size={22} /> : <Play size={22} />}
                        </button>
                        <audio
                          ref={el => { audioRefs.current[dest.id] = el }}
                          src={dest.podcastUrl}
                          onEnded={() => setPlayingId(null)}
                          controls
                          className="podcast-audio"
                        />
                      </div>
                    </div>
                  )}

                  <div className="dest-highlights">
                    <h4><Star size={16} /> {t('דגשים', 'Highlights')}</h4>
                    <div className="highlights-chips">
                      {(t(dest.highlightsHe.join('||'), dest.highlights.join('||'))).split('||').map((h, i) => (
                        <span key={i} className="highlight-chip">{h}</span>
                      ))}
                    </div>
                  </div>

                  <div className="dest-fun-facts">
                    <h4><Sparkles size={16} /> {t('עובדות מעניינות', 'Fun Facts')}</h4>
                    <ul>
                      {(lang => lang === 'he' ? dest.funFactsHe : dest.funFacts)(t('he', 'en')).map((fact, i) => (
                        <li key={i}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
