import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth, familyMembers } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { Plus, Trash2, RefreshCw, Wallet } from 'lucide-react'

// Currencies you can log a spend in. Rates are "per 1 USD" (same convention as CurrencyPage).
const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'CRC', symbol: '₡', flag: '🇨🇷' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'ILS', symbol: '₪', flag: '🇮🇱' },
]
const FALLBACK_RATES: Record<string, number> = { USD: 1, CRC: 505, EUR: 0.88, ILS: 3.05 }

interface Category {
  id: string
  he: string
  en: string
  emoji: string
}

// Day-to-day spending buckets for the trip
const CATEGORIES: Category[] = [
  { id: 'food', he: 'אוכל', en: 'Food', emoji: '🍽️' },
  { id: 'activities', he: 'פעילויות', en: 'Activities', emoji: '🎟️' },
  { id: 'accommodation', he: 'לינה', en: 'Accommodation', emoji: '🏨' },
  { id: 'shopping', he: 'קניות', en: 'Shopping', emoji: '🛍️' },
  { id: 'transport', he: 'תחבורה', en: 'Transport', emoji: '🚗' },
  { id: 'tips', he: 'טיפים', en: 'Tips', emoji: '💵' },
  { id: 'other', he: 'אחר', en: 'Other', emoji: '📦' },
]

// Pre-paid / planned big-ticket budget (informational reference, from the trip plan)
const PLANNED: { he: string; en: string; usd: number }[] = [
  { he: 'טיסות', en: 'Flights', usd: 9450 },
  { he: 'רכב + מדריך', en: 'Car + Guide', usd: 3350 },
  { he: 'פעילויות', en: 'Activities', usd: 4810 },
  { he: 'מלונות (קוסטה ריקה)', en: 'Hotels (Costa Rica)', usd: 13168 },
  { he: 'מלון (מדריד)', en: 'Hotel (Madrid)', usd: 2068 },
  { he: 'שונות / רזרבה', en: 'Extra / Buffer', usd: 6000 },
]

interface Expense {
  id: string
  amount: number      // original amount as entered
  currency: string    // original currency code
  usd: number         // value in USD, locked at entry time
  category: string
  note: string
  memberId: string
  ts: number
}

const usd0 = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
const usd2 = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function BudgetPage() {
  const { t, lang } = useLang()
  const { member, isParent } = useAuth()
  const [expenses, setExpenses] = useSharedState<Expense[]>('budget-expenses', [])

  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [ratesLive, setRatesLive] = useState(false)

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')

  const fetchRates = async () => {
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
        setRatesLive(true)
      }
    } catch { /* keep fallback */ }
  }
  useEffect(() => { fetchRates() }, [])

  const toUsd = (val: number, code: string) => val / (rates[code] ?? 1)

  const plannedTotal = useMemo(() => PLANNED.reduce((s, p) => s + p.usd, 0), [])
  const spentTotal = useMemo(() => expenses.reduce((s, e) => s + e.usd, 0), [expenses])

  const perCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) map[e.category] = (map[e.category] ?? 0) + e.usd
    return map
  }, [expenses])

  const sorted = useMemo(() => [...expenses].sort((a, b) => b.ts - a.ts), [expenses])

  const addExpense = () => {
    const val = parseFloat(amount)
    if (!val || val <= 0 || !member) return
    const entry: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount: val,
      currency,
      usd: toUsd(val, currency),
      category,
      note: note.trim(),
      memberId: member.id,
      ts: Date.now(),
    }
    setExpenses(prev => [...prev, entry])
    setAmount('')
    setNote('')
  }

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const memberName = (id: string) => {
    const m = familyMembers.find(x => x.id === id)
    return m ? t(m.name, m.nameEn) : ''
  }
  const memberEmoji = (id: string) => familyMembers.find(x => x.id === id)?.emoji ?? '👤'
  const catOf = (id: string) => CATEGORIES.find(c => c.id === id)

  // Budget is money-focused — hide from kids like the rest of the app's prices.
  if (!isParent) {
    return (
      <div className="budget-page">
        <h2 className="page-title">{t('💰 תקציב', '💰 Budget')}</h2>
        <div className="budget-locked">
          <Wallet size={40} />
          <p>{t('החלק הזה למבוגרים בלבד 🙂', 'This section is for grown-ups only 🙂')}</p>
        </div>
      </div>
    )
  }

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: '2-digit', month: '2-digit' })

  return (
    <div className="budget-page">
      <h2 className="page-title">{t('💰 תקציב הטיול', '💰 Trip Budget')}</h2>

      {/* Live spending summary */}
      <div className="budget-summary">
        <div className="budget-summary-label">{t('הוצאנו בפועל (בטיול)', 'Spent so far (on trip)')}</div>
        <div className="budget-summary-amount">{usd2(spentTotal)}</div>
        <div className="budget-summary-sub">
          {ratesLive
            ? t('הומר לפי שער חי', 'Converted at live rate')
            : t('הומר לפי שער משוער', 'Converted at approx rate')}
          <button className="budget-refresh" onClick={fetchRates} aria-label="Refresh rates">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Add expense */}
      <div className="budget-add">
        <div className="budget-add-row">
          <div className="budget-amount-wrap">
            <span className="budget-amount-symbol">
              {CURRENCIES.find(c => c.code === currency)?.symbol}
            </span>
            <input
              type="number"
              className="budget-amount-input"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              inputMode="decimal"
              min="0"
            />
          </div>
          <select className="budget-select" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>
        </div>

        <div className="budget-cat-grid">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={`budget-cat-btn ${category === c.id ? 'active' : ''}`}
              onClick={() => setCategory(c.id)}
              type="button"
            >
              <span className="budget-cat-emoji">{c.emoji}</span>
              <span>{t(c.he, c.en)}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          className="budget-note-input"
          placeholder={t('הערה (לא חובה)', 'Note (optional)')}
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={60}
        />

        <button className="budget-add-btn" onClick={addExpense} disabled={!amount || parseFloat(amount) <= 0}>
          <Plus size={18} /> {t('הוסף הוצאה', 'Add expense')}
          {amount && parseFloat(amount) > 0 && currency !== 'USD' && (
            <span className="budget-add-usd">≈ {usd2(toUsd(parseFloat(amount), currency))}</span>
          )}
        </button>
      </div>

      {/* Per-category live totals */}
      {spentTotal > 0 && (
        <div className="budget-breakdown">
          <h3>{t('לפי קטגוריה', 'By category')}</h3>
          {CATEGORIES.filter(c => (perCategory[c.id] ?? 0) > 0)
            .sort((a, b) => (perCategory[b.id] ?? 0) - (perCategory[a.id] ?? 0))
            .map(c => {
              const val = perCategory[c.id] ?? 0
              const pct = spentTotal > 0 ? (val / spentTotal) * 100 : 0
              return (
                <div key={c.id} className="budget-cat-line">
                  <div className="budget-cat-line-top">
                    <span>{c.emoji} {t(c.he, c.en)}</span>
                    <strong>{usd0(val)}</strong>
                  </div>
                  <div className="budget-cat-bar">
                    <div className="budget-cat-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Recent expenses */}
      {sorted.length > 0 && (
        <div className="budget-list">
          <h3>{t('הוצאות אחרונות', 'Recent expenses')}</h3>
          {sorted.map(e => {
            const c = catOf(e.category)
            const sym = CURRENCIES.find(x => x.code === e.currency)?.symbol ?? ''
            return (
              <div key={e.id} className="budget-item">
                <span className="budget-item-emoji">{c?.emoji ?? '📦'}</span>
                <div className="budget-item-main">
                  <div className="budget-item-top">
                    <span className="budget-item-cat">{c ? t(c.he, c.en) : e.category}</span>
                    {e.note && <span className="budget-item-note">· {e.note}</span>}
                  </div>
                  <div className="budget-item-meta">
                    {memberEmoji(e.memberId)} {memberName(e.memberId)} · {fmtDate(e.ts)}
                  </div>
                </div>
                <div className="budget-item-amounts">
                  <span className="budget-item-usd">{usd2(e.usd)}</span>
                  {e.currency !== 'USD' && (
                    <span className="budget-item-orig">{sym}{e.amount.toLocaleString()}</span>
                  )}
                </div>
                <button className="budget-item-del" onClick={() => removeExpense(e.id)} aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Planned pre-paid budget (reference) */}
      <div className="budget-planned">
        <h3>{t('תקציב מתוכנן (משולם מראש)', 'Planned budget (pre-paid)')}</h3>
        <p className="budget-planned-sub">
          {t(
            'הסכומים הגדולים ששולמו מראש — טיסות, מלונות, רכב ומדריך. ההוצאות למעלה הן על גבי אלה.',
            'The big items paid in advance — flights, hotels, car & guide. The spending above is on top of these.'
          )}
        </p>
        {PLANNED.map(p => (
          <div key={p.en} className="budget-planned-line">
            <span>{t(p.he, p.en)}</span>
            <strong>{usd0(p.usd)}</strong>
          </div>
        ))}
        <div className="budget-planned-total">
          <span>{t('סה״כ מתוכנן', 'Planned total')}</span>
          <strong>{usd0(plannedTotal)}</strong>
        </div>
        <div className="budget-grand-total">
          <span>{t('סה״כ כולל הוצאות בטיול', 'Grand total incl. trip spending')}</span>
          <strong>{usd0(plannedTotal + spentTotal)}</strong>
        </div>
      </div>
    </div>
  )
}
