import { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { Send, Bot, User, Loader, Paperclip, X, FileText } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Attachment {
  name: string
  data: string      // base64, no data: prefix
  mimeType: string
}

const MAX_FILE_MB = 10

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // strip "data:...;base64,"
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const chatFn = httpsCallable(functions, 'chat')

const SUGGESTIONS_HE = [
  '🍽️ מסעדות מומלצות ליד מנואל אנטוניו',
  '🦥 איפה הכי קל לראות עצלנים?',
  '🌧️ מה לקחת ליום גשום בג\'ונגל?',
  '📋 תוסיף ביקור בשוק מרכזי של סן חוזה ביום 15',
]

const SUGGESTIONS_EN = [
  '🍽️ Best restaurants near Manuel Antonio',
  '🦥 Where to spot sloths easily?',
  '🌧️ What to bring for a rainy jungle day?',
  '📋 Add a visit to San José central market on day 15',
]

export default function ChatPage() {
  const { t } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError(null)
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(t(`הקובץ גדול מדי (מקסימום ${MAX_FILE_MB}MB)`, `File too large (max ${MAX_FILE_MB}MB)`))
      return
    }
    try {
      const data = await readFileAsBase64(file)
      setAttachment({ name: file.name, data, mimeType: file.type || 'application/octet-stream' })
    } catch {
      setFileError(t('לא הצלחנו לקרוא את הקובץ', 'Could not read the file'))
    }
  }

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if ((!trimmed && !attachment) || loading) return
    const displayText = trimmed || (attachment ? t(`📎 ${attachment.name}`, `📎 ${attachment.name}`) : '')
    const userMsg: Message = { role: 'user', content: displayText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    const sentFile = attachment
    setAttachment(null)
    setLoading(true)

    try {
      const result = await chatFn({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        file: sentFile ? { data: sentFile.data, mimeType: sentFile.mimeType } : undefined,
      })
      const data = result.data as { content: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('אופס, משהו השתבש. נסו שוב!', 'Oops, something went wrong. Try again!'),
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isHebrew = t('he', 'en') === 'he'
  const suggestions = isHebrew ? SUGGESTIONS_HE : SUGGESTIONS_EN

  return (
    <div className="chat-page">
      <div className="chat-header-bar">
        <Bot size={20} />
        <span>{t('🌴 מדריך הטיול', '🌴 Trip Guide')}</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">🦜</div>
            <h3>{t('שלום! אני המדריך שלכם', 'Hi! I\'m your travel guide')}</h3>
            <p>{t(
              'שאלו אותי כל שאלה על קוסטה ריקה ומדריד — מסעדות, טיפים, חיות בר, מזג אוויר ועוד!',
              'Ask me anything about Costa Rica and Madrid — restaurants, tips, wildlife, weather and more!'
            )}</p>
            <div className="chat-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className="chat-bubble-avatar">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="chat-bubble-content">
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant">
            <div className="chat-bubble-avatar"><Bot size={16} /></div>
            <div className="chat-bubble-content chat-typing">
              <Loader size={16} className="chat-spinner" />
              <span>{t('חושב...', 'Thinking...')}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {(attachment || fileError) && (
        <div className="chat-attachment-bar">
          {attachment && (
            <div className="chat-attachment-chip">
              <FileText size={14} />
              <span>{attachment.name}</span>
              <button onClick={() => setAttachment(null)} aria-label="Remove attachment"><X size={14} /></button>
            </div>
          )}
          {fileError && <span className="chat-file-error">{fileError}</span>}
        </div>
      )}

      <div className="chat-input-bar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFilePick}
          style={{ display: 'none' }}
        />
        <button
          className="chat-attach-btn"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          aria-label={t('צרף קובץ', 'Attach file')}
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={attachment ? t('הוסיפו הודעה (לא חובה)...', 'Add a message (optional)...') : t('שאלו שאלה...', 'Ask a question...')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={(!input.trim() && !attachment) || loading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
