import { useState } from 'react'
import { Trophy, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'

interface Sticker {
  id: string
  name: string
  nameHe: string
  emoji: string
  image: string
  day: string
  dayHe: string
  category: 'nature' | 'adventure' | 'culture' | 'wildlife'
  code: string
}

const stickers: Sticker[] = [
  { id: 'chocolate-tour', name: 'Chocolate Master', nameHe: 'אלוף השוקולד', emoji: '🍫', image: '/images/arenal-volcano.jpg', day: 'Day 2', dayHe: 'יום 2', category: 'culture', code: '2483' },
  { id: 'rafting', name: 'River Rider', nameHe: 'רוכב הנהר', emoji: '🚣', image: '/images/arenal-volcano.jpg', day: 'Day 3', dayHe: 'יום 3', category: 'adventure', code: '3761' },
  { id: 'arenal-hike', name: 'Volcano Explorer', nameHe: 'חוקר הרי געש', emoji: '🌋', image: '/images/arenal-volcano.jpg', day: 'Day 3', dayHe: 'יום 3', category: 'nature', code: '1968' },
  { id: 'hot-springs', name: 'Hot Spring Relaxer', nameHe: 'נהנה במעיינות', emoji: '♨️', image: '/images/arenal-volcano.jpg', day: 'Day 3', dayHe: 'יום 3', category: 'nature', code: '4215' },
  { id: 'canyoning', name: 'Canyon Conqueror', nameHe: 'כובש הקניון', emoji: '🧗', image: '/images/arenal-volcano.jpg', day: 'Day 4', dayHe: 'יום 4', category: 'adventure', code: '5839' },
  { id: 'waterfall', name: 'Waterfall Warrior', nameHe: 'לוחם המפל', emoji: '💦', image: '/images/arenal-volcano.jpg', day: 'Day 4', dayHe: 'יום 4', category: 'nature', code: '7024' },
  { id: 'night-tour', name: 'Night Owl', nameHe: 'ינשוף הלילה', emoji: '🦉', image: '/images/arenal-volcano.jpg', day: 'Day 4', dayHe: 'יום 4', category: 'wildlife', code: '6391' },
  { id: 'rio-celeste', name: 'Blue River Discoverer', nameHe: 'מגלה הנהר הכחול', emoji: '💎', image: '/images/rio-celeste.jpg', day: 'Day 5', dayHe: 'יום 5', category: 'nature', code: '8547' },
  { id: 'horseback', name: 'Horseback Hero', nameHe: 'גיבור הסוסים', emoji: '🐴', image: '/images/rio-celeste.jpg', day: 'Day 5', dayHe: 'יום 5', category: 'adventure', code: '2916' },
  { id: 'rincon', name: 'Mud Pot Master', nameHe: 'מאסטר בריכות הבוץ', emoji: '🫧', image: '/images/rincon-vieja.jpg', day: 'Day 6', dayHe: 'יום 6', category: 'nature', code: '4673' },
  { id: 'hanging-bridges', name: 'Bridge Walker', nameHe: 'הולך הגשרים', emoji: '🌉', image: '/images/monteverde.jpg', day: 'Day 7', dayHe: 'יום 7', category: 'adventure', code: '3158' },
  { id: 'zipline', name: 'Zipline Flyer', nameHe: 'טייס הזיפליין', emoji: '🦅', image: '/images/monteverde.jpg', day: 'Day 8', dayHe: 'יום 8', category: 'adventure', code: '9204' },
  { id: 'manuel-antonio', name: 'Beach & Jungle', nameHe: "ג'ונגל וחוף", emoji: '🏖️', image: '/images/manuel-antonio.jpg', day: 'Day 9', dayHe: 'יום 9', category: 'nature', code: '5782' },
  { id: 'catamaran', name: 'Sailor', nameHe: 'מלח', emoji: '⛵', image: '/images/manuel-antonio.jpg', day: 'Day 10', dayHe: 'יום 10', category: 'adventure', code: '1346' },
  { id: 'mangrove', name: 'Mangrove Navigator', nameHe: 'נווט המנגרובים', emoji: '🌊', image: '/images/manuel-antonio.jpg', day: 'Day 11', dayHe: 'יום 11', category: 'nature', code: '6429' },
  { id: 'corcovado', name: 'Corcovado Survivor', nameHe: 'שורד קורקובדו', emoji: '🐾', image: '/images/uvita-corcovado.jpg', day: 'Day 12', dayHe: 'יום 12', category: 'wildlife', code: '8071' },
  { id: 'nauyaca', name: 'Waterfall Rider', nameHe: 'רוכב למפל', emoji: '🐎', image: '/images/uvita-corcovado.jpg', day: 'Day 13', dayHe: 'יום 13', category: 'adventure', code: '3695' },
  { id: 'quetzal', name: 'Quetzal Spotter', nameHe: 'צופה הקצאל', emoji: '🦜', image: '/images/san-gerardo.jpg', day: 'Day 14', dayHe: 'יום 14', category: 'wildlife', code: '7518' },
  { id: 'prado', name: 'Art Connoisseur', nameHe: 'מומחה אמנות', emoji: '🎨', image: '/images/madrid.jpg', day: 'Day 17', dayHe: 'יום 17', category: 'culture', code: '4960' },
  { id: 'tapas', name: 'Tapas Taster', nameHe: 'טועם הטאפס', emoji: '🍽️', image: '/images/madrid.jpg', day: 'Day 17', dayHe: 'יום 17', category: 'culture', code: '2837' },
]

export default function AchievementsPage() {
  const { t } = useLang()
  const { isParent } = useAuth()
  const [earned, setEarned] = useSharedState<Record<string, boolean>>('achievements', {})
  const [justEarned, setJustEarned] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [showCodes, setShowCodes] = useState(false)

  const earnedCount = Object.values(earned).filter(Boolean).length
  const totalCount = stickers.length
  const pct = Math.round((earnedCount / totalCount) * 100)

  const handleStickerTap = (id: string) => {
    if (earned[id]) return
    setConfirmId(id)
    setCodeInput('')
    setCodeError(false)
  }

  const confirmEarn = () => {
    if (!confirmId) return
    const sticker = stickers.find(s => s.id === confirmId)!
    if (codeInput !== sticker.code) {
      setCodeError(true)
      return
    }
    setEarned(prev => ({ ...prev, [confirmId]: true }))
    setJustEarned(confirmId)
    setConfirmId(null)
    setCodeInput('')
    setCodeError(false)
    setTimeout(() => setJustEarned(null), 1500)
  }

  const categoryColors: Record<string, string> = {
    nature: '#059669',
    adventure: '#7c3aed',
    culture: '#d97706',
    wildlife: '#2563eb',
  }

  const categoryNames: Record<string, { he: string; en: string }> = {
    nature: { he: 'טבע', en: 'Nature' },
    adventure: { he: 'הרפתקאות', en: 'Adventure' },
    culture: { he: 'תרבות', en: 'Culture' },
    wildlife: { he: 'חיות בר', en: 'Wildlife' },
  }

  return (
    <div className="achievements-page">
      <div className="achievements-hero">
        <div className="achievements-trophy">
          <Trophy size={32} />
        </div>
        <h2>{t('🏆 ספר המדבקות', '🏆 Sticker Book')}</h2>
        <p>{t('אספו מדבקות בכל אטרקציה!', 'Collect stickers at each attraction!')}</p>
      </div>

      {/* Progress Bar */}
      <div className="achievements-progress">
        <div className="achievements-progress-header">
          <span>{t('התקדמות', 'Progress')}</span>
          <span className="achievements-progress-count">{earnedCount}/{totalCount}</span>
        </div>
        <div className="achievements-progress-bar">
          <div className="achievements-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="achievements-progress-cats">
          {Object.entries(categoryNames).map(([key, val]) => {
            const catCount = stickers.filter(s => s.category === key && earned[s.id]).length
            const catTotal = stickers.filter(s => s.category === key).length
            return (
              <span key={key} className="achievements-cat-badge" style={{ background: categoryColors[key] + '18', color: categoryColors[key] }}>
                {t(val.he, val.en)} {catCount}/{catTotal}
              </span>
            )
          })}
        </div>
      </div>

      {/* Parent Code Reference */}
      {isParent && (
        <div className="sticker-codes-section">
          <button className="sticker-codes-toggle" onClick={() => setShowCodes(!showCodes)}>
            {showCodes ? <EyeOff size={16} /> : <Eye size={16} />}
            {t(showCodes ? 'הסתר קודים' : 'הצג קודים להורים', showCodes ? 'Hide codes' : 'Show codes (parents)')}
          </button>
          {showCodes && (
            <div className="sticker-codes-list">
              {stickers.filter(s => !earned[s.id]).map(s => (
                <div key={s.id} className="sticker-code-item">
                  <span>{s.emoji} {t(s.nameHe, s.name)}</span>
                  <span className="sticker-code-value">{s.code}</span>
                </div>
              ))}
              {stickers.every(s => earned[s.id]) && (
                <p className="sticker-codes-done">{t('כל המדבקות נאספו! 🎉', 'All stickers collected! 🎉')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sticker Grid */}
      <div className="sticker-grid">
        {stickers.map(s => {
          const isEarned = earned[s.id]
          const isNew = justEarned === s.id
          return (
            <button
              key={s.id}
              className={`sticker-slot ${isEarned ? 'earned' : 'empty'} ${isNew ? 'just-earned' : ''}`}
              onClick={() => handleStickerTap(s.id)}
              style={{ '--cat-color': categoryColors[s.category] } as React.CSSProperties}
            >
              {isEarned ? (
                <div className="sticker-earned">
                  <span className="sticker-emoji">{s.emoji}</span>
                  <img src={s.image} alt={t(s.nameHe, s.name)} className="sticker-bg" />
                </div>
              ) : (
                <div className="sticker-placeholder">
                  <span className="sticker-q">?</span>
                </div>
              )}
              <div className="sticker-label">
                <span className="sticker-name">{t(s.nameHe, s.name)}</span>
                <span className="sticker-day">{t(s.dayHe, s.day)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Confirm Modal */}
      {confirmId && (() => {
        const s = stickers.find(x => x.id === confirmId)!
        return (
          <div className="sticker-modal-overlay" onClick={() => setConfirmId(null)}>
            <div className="sticker-modal" onClick={e => e.stopPropagation()}>
              <div className="sticker-modal-preview">
                <img src={s.image} alt={t(s.nameHe, s.name)} />
                <span className="sticker-modal-emoji">{s.emoji}</span>
              </div>
              <h3>{t(s.nameHe, s.name)}</h3>
              <p className="sticker-modal-day">{t(s.dayHe, s.day)}</p>
              <p className="sticker-modal-q">{t('הכניסו את הקוד הסודי כדי להדביק!', 'Enter the secret code to stick it!')}</p>
              <div className="sticker-code-input-wrap">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  className={`sticker-code-input ${codeError ? 'error' : ''}`}
                  placeholder="● ● ● ●"
                  value={codeInput}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setCodeInput(val)
                    setCodeError(false)
                  }}
                  autoFocus
                />
                {codeError && (
                  <span className="sticker-code-error">{t('קוד שגוי, נסו שוב!', 'Wrong code, try again!')}</span>
                )}
              </div>
              <div className="sticker-modal-actions">
                <button className="game-btn secondary" onClick={() => setConfirmId(null)}>
                  {t('ביטול', 'Cancel')}
                </button>
                <button className="game-btn" onClick={confirmEarn} disabled={codeInput.length < 4}>
                  <Sparkles size={16} /> {t('הדבק!', 'Stick it!')}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
