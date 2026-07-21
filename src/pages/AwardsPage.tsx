import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { X, Send, Sparkles, Loader } from 'lucide-react'

interface Award {
  id: string
  fromId: string
  fromName: string
  fromNameEn: string
  fromEmoji: string
  toId: string
  toName: string
  toNameEn: string
  toEmoji: string
  icon: string
  message: string
  timestamp: number
  imageUrl?: string
}

const EVERYONE_ID = '__everyone__'

const generateImageFn = httpsCallable(functions, 'generateAwardImage')
const sendNotificationFn = httpsCallable(functions, 'sendNotification')

const CR_ICONS = [
  '🌋', '🦜', '🐒', '🦥', '🐸', '🦋', '🐢', '🌺', '🌴', '🍫',
  '☕', '🌊', '🏄', '🛶', '🧗', '🐊', '🦎', '🌈', '🌿', '🍍',
  '🥥', '🦩', '🐬', '🐋', '🌅', '⛰️', '🗻', '🏝️', '🌸', '🦅',
  '🐝', '🪲', '🦇', '🌳', '🎋', '🪸', '🐠', '🦈', '🪺', '🥭',
  '🎒', '🧭', '🔭', '🪂', '🏕️', '🌮', '🎶', '⭐', '🏅', '💎',
]

const FAMILY = [
  { id: 'ofir', name: 'אופיר', nameEn: 'Ofir', emoji: '👨', avatar: '/images/avatar-ofir.jpg', email: 'ofiralon10@gmail.com' },
  { id: 'merav', name: 'מירב', nameEn: 'Merav', emoji: '👩', avatar: '/images/avatar-merav.jpg', email: 'merav.yanai@gmail.com' },
  { id: 'maya', name: 'מאיה', nameEn: 'Maya', emoji: '👩‍🦱', avatar: '/images/avatar-maya.jpg', email: 'mayalon03@gmail.com' },
  { id: 'matan', name: 'מתן', nameEn: 'Matan', emoji: '👦', avatar: '/images/avatar-matan.jpg', email: 'matan.alon333@gmail.com' },
  { id: 'yoav', name: 'יואב', nameEn: 'Yoav', emoji: '🧒', avatar: '/images/avatar-yoav.jpg', email: 'yoav.alon333@gmail.com' },
]

const BAR_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

export default function AwardsPage() {
  const { t } = useLang()
  const { member } = useAuth()
  const [awards, setAwards] = useSharedState<Award[]>('awards', [])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTo, setSelectedTo] = useState<string | null>(null)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [notifyEveryone, setNotifyEveryone] = useState(true)

  const currentMember = member
    ? FAMILY.find(f => f.email === member.email) || FAMILY[0]
    : FAMILY[0]

  const otherMembers = FAMILY.filter(f => f.id !== currentMember.id)

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || generatingImage) return
    setGeneratingImage(true)
    try {
      const result = await generateImageFn({ prompt: imagePrompt.trim() })
      const data = result.data as { image: string }
      setGeneratedImage(`data:image/jpeg;base64,${data.image}`)
    } catch (err) {
      console.error('Image generation error:', err)
    }
    setGeneratingImage(false)
  }

  const handleSend = () => {
    if (!selectedTo || !selectedIcon || !message.trim()) return
    const ts = Date.now()
    const msg = message.trim()
    const base = {
      fromId: currentMember.id,
      fromName: currentMember.name,
      fromNameEn: currentMember.nameEn,
      fromEmoji: currentMember.emoji,
      icon: selectedIcon,
      message: msg,
      timestamp: ts,
      ...(generatedImage ? { imageUrl: generatedImage } : {}),
    }

    let toEveryone = false
    if (selectedTo === EVERYONE_ID) {
      toEveryone = true
      const newAwards = otherMembers.map((to, i) => ({
        ...base,
        id: `${ts}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        toId: to.id,
        toName: to.name,
        toNameEn: to.nameEn,
        toEmoji: to.emoji,
      }))
      setAwards(prev => [...newAwards, ...prev])
    } else {
      const to = FAMILY.find(f => f.id === selectedTo)!
      const award: Award = {
        ...base,
        id: `${ts}-${Math.random().toString(36).slice(2, 6)}`,
        toId: to.id,
        toName: to.name,
        toNameEn: to.nameEn,
        toEmoji: to.emoji,
      }
      setAwards(prev => [award, ...prev])
    }

    // Optionally notify the whole family (fire-and-forget; best effort)
    if (notifyEveryone) {
      const targets = FAMILY.filter(f => f.id !== currentMember.id).map(f => f.id)
      const recipient = toEveryone
        ? t('כל המשפחה', 'the whole family')
        : t(FAMILY.find(f => f.id === selectedTo)?.name || '', FAMILY.find(f => f.id === selectedTo)?.nameEn || '')
      sendNotificationFn({
        targetMemberIds: targets,
        title: t('🏅 פרס חדש!', '🏅 New Award!'),
        body: t(
          `${selectedIcon} ${currentMember.name} נתן פרס ל${recipient}: ${msg}`,
          `${selectedIcon} ${currentMember.nameEn} gave an award to ${recipient}: ${msg}`
        ),
        data: { url: '/awards' },
      }).catch(() => { /* notifications are best-effort */ })
    }

    setShowCreate(false)
    setSelectedTo(null)
    setSelectedIcon(null)
    setMessage('')
    setImagePrompt('')
    setGeneratedImage(null)
    setNotifyEveryone(true)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const day = d.getDate()
    const month = d.toLocaleString('en', { month: 'short' })
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${month}, ${hours}:${mins}`
  }

  const getMemberAwardCount = (memberId: string) =>
    awards.filter(a => a.toId === memberId).length

  const maxCount = Math.max(1, ...FAMILY.map(f => getMemberAwardCount(f.id)))

  return (
    <div className="awards-page">
      <h2 className="page-title">{t('🏅 פרסי משפחה', '🏅 Family Awards')}</h2>

      {/* Bar Chart */}
      <div className="awards-chart">
        <div className="awards-chart-bars">
          {FAMILY.map((f, i) => {
            const count = getMemberAwardCount(f.id)
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={f.id} className="awards-chart-col">
                <span className="awards-chart-count">{count}</span>
                <div className="awards-chart-bar-wrap">
                  <div
                    className="awards-chart-bar"
                    style={{ height: `${Math.max(pct, 4)}%`, background: BAR_COLORS[i] }}
                  />
                </div>
                <img src={f.avatar} alt={f.nameEn} className="awards-chart-avatar" />
                <span className="awards-chart-name">{t(f.name, f.nameEn)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Give Award Button */}
      <button className="awards-give-btn" onClick={() => setShowCreate(true)}>
        🏅 {t('תנו פרס!', 'Give an Award!')}
      </button>

      {/* Awards Feed */}
      {awards.length === 0 ? (
        <div className="awards-empty">
          <span className="awards-empty-icon">🎖️</span>
          <p>{t('עדיין אין פרסים. תהיו הראשונים!', 'No awards yet. Be the first!')}</p>
        </div>
      ) : (
        <div className="awards-feed">
          {awards.map(award => (
            <div key={award.id} className="award-card">
              <div className="award-card-icon">{award.icon}</div>
              <div className="award-card-body">
                <div className="award-card-header">
                  <span>
                    {award.fromEmoji} {t(award.fromName, award.fromNameEn)}
                    {t(' ← ', ' → ')}
                    {award.toEmoji} {t(award.toName, award.toNameEn)}
                  </span>
                </div>
                <p className="award-card-msg">{award.message}</p>
                {award.imageUrl && (
                  <img src={award.imageUrl} alt="Award" className="award-card-image" />
                )}
                <span className="award-card-time">{formatTime(award.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Award Modal */}
      {showCreate && (
        <div className="sticker-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="awards-modal" onClick={e => e.stopPropagation()}>
            <button className="awards-modal-close" onClick={() => setShowCreate(false)}>
              <X size={20} />
            </button>
            <h3>{t('🏅 תנו פרס', '🏅 Give an Award')}</h3>

            {/* Step 1: Who */}
            <label className="awards-label">{t('למי?', 'To whom?')}</label>
            <div className="awards-member-pick">
              <button
                className={`awards-member-btn everyone ${selectedTo === EVERYONE_ID ? 'selected' : ''}`}
                onClick={() => setSelectedTo(EVERYONE_ID)}
              >
                <span className="awards-member-emoji">👨‍👩‍👧‍👦</span>
                <span>{t('כולם!', 'Everyone!')}</span>
              </button>
              {otherMembers.map(m => (
                <button
                  key={m.id}
                  className={`awards-member-btn ${selectedTo === m.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTo(m.id)}
                >
                  <span className="awards-member-emoji">{m.emoji}</span>
                  <span>{t(m.name, m.nameEn)}</span>
                </button>
              ))}
            </div>

            {/* Step 2: Icon */}
            <label className="awards-label">{t('בחרו אייקון', 'Choose an icon')}</label>
            <div className="awards-icon-grid">
              {CR_ICONS.map(icon => (
                <button
                  key={icon}
                  className={`awards-icon-btn ${selectedIcon === icon ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Step 3: Message */}
            <label className="awards-label">{t('למה?', 'Why?')}</label>
            <textarea
              className="awards-textarea"
              placeholder={t('כתבו משפט קצר...', 'Write a short sentence...')}
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={120}
              rows={2}
            />

            {/* Step 4: AI Image (optional) */}
            <label className="awards-label">
              <Sparkles size={14} /> {t('תמונה מיוחדת (אופציונלי)', 'Special image (optional)')}
            </label>
            <div className="awards-ai-image">
              <div className="awards-ai-input-row">
                <input
                  type="text"
                  className="awards-ai-prompt"
                  placeholder={t('תארו תמונה... למשל: תוכי על חוף טרופי', 'Describe an image... e.g. a parrot on a tropical beach')}
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  maxLength={100}
                  disabled={generatingImage}
                />
                <button
                  className="awards-ai-gen-btn"
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || generatingImage}
                >
                  {generatingImage ? <Loader size={16} className="chat-spinner" /> : <Sparkles size={16} />}
                </button>
              </div>
              {generatedImage && (
                <div className="awards-ai-preview">
                  <img src={generatedImage} alt="Generated" />
                  <button className="awards-ai-remove" onClick={() => { setGeneratedImage(null); setImagePrompt('') }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Notify toggle */}
            <label className="awards-notify-row">
              <span>🔔 {t('הודע לכל המשפחה', 'Notify the whole family')}</span>
              <span className="awards-switch">
                <input
                  type="checkbox"
                  checked={notifyEveryone}
                  onChange={e => setNotifyEveryone(e.target.checked)}
                />
                <span className="awards-switch-track" />
                <span className="awards-switch-knob" />
              </span>
            </label>

            {/* Send */}
            <button
              className="awards-send-btn"
              disabled={!selectedTo || !selectedIcon || !message.trim()}
              onClick={handleSend}
            >
              <Send size={16} />
              {t('שלחו!', 'Send!')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
