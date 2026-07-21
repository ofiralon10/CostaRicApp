import { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { ArrowUpDown, RefreshCw } from 'lucide-react'

interface CurrencyMeta {
  code: string
  name: string
  nameHe: string
  symbol: string
  flag: string
}

const CURRENCY_META: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar', nameHe: 'דולר אמריקאי', symbol: '$', flag: '🇺🇸' },
  { code: 'CRC', name: 'Costa Rican Colón', nameHe: 'קולון קוסטה ריקני', symbol: '₡', flag: '🇨🇷' },
  { code: 'EUR', name: 'Euro', nameHe: 'אירו', symbol: '€', flag: '🇪🇺' },
  { code: 'ILS', name: 'Israeli Shekel', nameHe: 'שקל ישראלי', symbol: '₪', flag: '🇮🇱' },
]

// Fallback rates (per 1 USD) used only if the live fetch fails
const FALLBACK_RATES: Record<string, number> = { USD: 1, CRC: 505, EUR: 0.88, ILS: 3.05 }

const QUICK_AMOUNTS_USD = [1, 5, 10, 20, 50, 100]

export default function CurrencyPage() {
  const { t, lang } = useLang()
  const [fromIdx, setFromIdx] = useState(0)
  const [toIdx, setToIdx] = useState(1)
  const [amount, setAmount] = useState('10')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [updated, setUpdated] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading')

  const fetchRates = async () => {
    setStatus('loading')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' })
      const data = await res.json()
      if (data?.result === 'success' && data.rates) {
        setRates({
          USD: 1,
          CRC: data.rates.CRC ?? FALLBACK_RATES.CRC,
          EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
          ILS: data.rates.ILS ?? FALLBACK_RATES.ILS,
        })
        setUpdated((data.time_last_update_unix ?? Math.floor(Date.now() / 1000)) * 1000)
        setStatus('live')
        return
      }
      setStatus('offline')
    } catch {
      setStatus('offline')
    }
  }

  useEffect(() => { fetchRates() }, [])

  const from = CURRENCY_META[fromIdx]
  const to = CURRENCY_META[toIdx]
  const fromRate = rates[from.code] ?? 1
  const toRate = rates[to.code] ?? 1

  const convert = (val: number) => (val / fromRate) * toRate

  const numAmount = parseFloat(amount) || 0
  const result = convert(numAmount)

  const swap = () => {
    setFromIdx(toIdx)
    setToIdx(fromIdx)
  }

  const perUnit = toRate / fromRate
  const rateDisplay = `1 ${from.code} = ${perUnit.toLocaleString(undefined, { maximumFractionDigits: from.code === 'CRC' || to.code === 'CRC' ? 2 : 4 })} ${to.code}`

  const updatedStr = updated
    ? new Date(updated).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="currency-page">
      <h2 className="page-title">{t('💱 המרת מטבעות', '💱 Currency Converter')}</h2>

      <div className={`currency-status ${status}`}>
        {status === 'loading' && <span>{t('טוען שערים...', 'Loading rates...')}</span>}
        {status === 'live' && (
          <>
            <span className="currency-status-dot live" />
            <span>{t(`שער חי · עודכן ${updatedStr}`, `Live rate · updated ${updatedStr}`)}</span>
            <button className="currency-refresh" onClick={fetchRates} aria-label="Refresh rates"><RefreshCw size={14} /></button>
          </>
        )}
        {status === 'offline' && (
          <>
            <span className="currency-status-dot offline" />
            <span>{t('שערים משוערים (אין חיבור)', 'Approximate rates (offline)')}</span>
            <button className="currency-refresh" onClick={fetchRates} aria-label="Retry"><RefreshCw size={14} /></button>
          </>
        )}
      </div>

      <div className="currency-card">
        <div className="currency-row">
          <label className="currency-label">{t('מ-', 'From')}</label>
          <select
            className="currency-select"
            value={fromIdx}
            onChange={e => setFromIdx(Number(e.target.value))}
          >
            {CURRENCY_META.map((c, i) => (
              <option key={c.code} value={i}>{c.flag} {c.code} — {t(c.nameHe, c.name)}</option>
            ))}
          </select>
          <div className="currency-input-wrap">
            <span className="currency-symbol">{from.symbol}</span>
            <input
              type="number"
              className="currency-input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              min="0"
            />
          </div>
        </div>

        <button className="currency-swap" onClick={swap} aria-label="Swap currencies">
          <ArrowUpDown size={20} />
        </button>

        <div className="currency-row">
          <label className="currency-label">{t('ל-', 'To')}</label>
          <select
            className="currency-select"
            value={toIdx}
            onChange={e => setToIdx(Number(e.target.value))}
          >
            {CURRENCY_META.map((c, i) => (
              <option key={c.code} value={i}>{c.flag} {c.code} — {t(c.nameHe, c.name)}</option>
            ))}
          </select>
          <div className="currency-result-wrap">
            <span className="currency-symbol">{to.symbol}</span>
            <span className="currency-result-value">
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="currency-rate">{rateDisplay}</div>
      </div>

      <div className="currency-quick">
        <h3>{t('המרות מהירות', 'Quick Conversions')}</h3>
        <div className="currency-quick-grid">
          {QUICK_AMOUNTS_USD.map(usd => (
            <div key={usd} className="currency-quick-item">
              <span className="currency-quick-usd">${usd}</span>
              <div className="currency-quick-results">
                <span>₡{(usd * rates.CRC).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span>€{(usd * rates.EUR).toFixed(2)}</span>
                <span>₪{(usd * rates.ILS).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="currency-tips">
        <h3>{t('💡 טיפים', '💡 Tips')}</h3>
        <ul>
          <li>{t(
            'בקוסטה ריקה אפשר לשלם בדולרים כמעט בכל מקום',
            'In Costa Rica you can pay with USD almost everywhere'
          )}</li>
          <li>{t(
            'עדיף למשוך מזומן מכספומטים של בנקים גדולים',
            'Better to withdraw cash from major bank ATMs'
          )}</li>
          <li>{t(
            'במדריד משתמשים באירו — כדאי להחליף מראש',
            'Madrid uses Euro — exchange in advance'
          )}</li>
          <li>{t(
            'השערים מתעדכנים אונליין — ייתכן הבדל קטן מהשער בפועל בבנק',
            'Rates update live online — the bank\'s actual rate may differ slightly'
          )}</li>
        </ul>
      </div>
    </div>
  )
}
