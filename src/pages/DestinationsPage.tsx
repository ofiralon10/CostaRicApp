import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Star } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { destinations } from '../data/destinations'

export default function DestinationsPage() {
  const { t } = useLang()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="destinations-page">
      <h2 className="page-title">{t('יעדים', 'Destinations')}</h2>

      <div className="destinations-grid">
        {destinations.map(dest => {
          const isExpanded = expandedId === dest.id
          return (
            <div
              key={dest.id}
              className={`destination-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(prev => (prev === dest.id ? null : dest.id))}
            >
              <div className="dest-header">
                <span className="dest-emoji">{dest.image}</span>
                <div className="dest-header-text">
                  <h3>{t(dest.nameHe, dest.name)}</h3>
                  <span className="dest-days">
                    {t(`ימים ${dest.days.join(', ')}`, `Days ${dest.days.join(', ')}`)}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {isExpanded && (
                <div className="dest-details">
                  <p className="dest-description">{t(dest.descriptionHe, dest.description)}</p>

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
