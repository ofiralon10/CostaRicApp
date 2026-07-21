import { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { Check, RotateCcw } from 'lucide-react'

interface PackingItem {
  id: string
  name: string
  nameHe: string
}

interface PackingCategory {
  id: string
  name: string
  nameHe: string
  emoji: string
  items: PackingItem[]
}

const CATEGORIES: PackingCategory[] = [
  {
    id: 'documents',
    name: 'Documents',
    nameHe: 'מסמכים',
    emoji: '📄',
    items: [
      { id: 'd1', name: 'Passports', nameHe: 'דרכונים' },
      { id: 'd2', name: 'Travel insurance', nameHe: 'ביטוח נסיעות' },
      { id: 'd3', name: 'Flight tickets (printed)', nameHe: 'כרטיסי טיסה (מודפסים)' },
      { id: 'd4', name: 'Hotel confirmations', nameHe: 'אישורי מלון' },
      { id: 'd5', name: 'Credit cards', nameHe: 'כרטיסי אשראי' },
      { id: 'd6', name: 'USD cash', nameHe: 'מזומן דולרים' },
      { id: 'd7', name: 'Driver\'s license', nameHe: 'רישיון נהיגה' },
      { id: 'd8', name: 'Emergency contacts list', nameHe: 'רשימת טלפונים לחירום' },
    ],
  },
  {
    id: 'clothing',
    name: 'Clothing',
    nameHe: 'ביגוד',
    emoji: '👕',
    items: [
      { id: 'c1', name: 'Light hiking clothes', nameHe: 'בגדי הליכה קלים' },
      { id: 'c2', name: 'Swimsuits', nameHe: 'בגדי ים' },
      { id: 'c3', name: 'Rain jacket / poncho', nameHe: 'מעיל גשם / פונצ\'ו' },
      { id: 'c4', name: 'Hiking shoes', nameHe: 'נעלי הליכה' },
      { id: 'c5', name: 'Sandals / flip-flops', nameHe: 'סנדלים / כפכפים' },
      { id: 'c6', name: 'Long sleeves for evenings', nameHe: 'שרוולים ארוכים לערב' },
      { id: 'c7', name: 'Light long pants', nameHe: 'מכנסיים ארוכים קלים' },
      { id: 'c8', name: 'Socks (quick-dry)', nameHe: 'גרביים (מתייבשים מהר)' },
      { id: 'c9', name: 'Hat / cap', nameHe: 'כובע' },
    ],
  },
  {
    id: 'gear',
    name: 'Gear & Electronics',
    nameHe: 'ציוד ואלקטרוניקה',
    emoji: '🎒',
    items: [
      { id: 'g1', name: 'Phone chargers', nameHe: 'מטענים לטלפון' },
      { id: 'g2', name: 'Power bank', nameHe: 'סוללת גיבוי' },
      { id: 'g3', name: 'Camera + charger', nameHe: 'מצלמה + מטען' },
      { id: 'g4', name: 'Binoculars', nameHe: 'משקפת' },
      { id: 'g5', name: 'Daypack / small backpack', nameHe: 'תיק גב קטן ליום' },
      { id: 'g6', name: 'Dry bag (waterproof)', nameHe: 'שקית אטומה למים' },
      { id: 'g7', name: 'Water bottles', nameHe: 'בקבוקי מים' },
      { id: 'g8', name: 'Travel adapter (Type A/B)', nameHe: 'מתאם חשמל (Type A/B)' },
      { id: 'g9', name: 'Headphones', nameHe: 'אוזניות' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Toiletries',
    nameHe: 'בריאות וטואלטיקה',
    emoji: '💊',
    items: [
      { id: 'h1', name: 'Sunscreen (SPF 50+)', nameHe: 'קרם הגנה (SPF 50+)' },
      { id: 'h2', name: 'Insect repellent (DEET)', nameHe: 'דוחה יתושים (DEET)' },
      { id: 'h3', name: 'Personal medications', nameHe: 'תרופות אישיות' },
      { id: 'h4', name: 'First aid kit', nameHe: 'ערכת עזרה ראשונה' },
      { id: 'h5', name: 'Anti-diarrhea medicine', nameHe: 'תרופה נגד שלשול' },
      { id: 'h6', name: 'Motion sickness pills', nameHe: 'כדורים נגד מחלת ים' },
      { id: 'h7', name: 'Toothbrush & toothpaste', nameHe: 'מברשת ומשחת שיניים' },
      { id: 'h8', name: 'Shampoo & soap (travel)', nameHe: 'שמפו וסבון (מטען)' },
      { id: 'h9', name: 'After-sun lotion', nameHe: 'קרם אפטר סאן' },
    ],
  },
  {
    id: 'adventure',
    name: 'Adventure Gear',
    nameHe: 'ציוד הרפתקאות',
    emoji: '🧗',
    items: [
      { id: 'a1', name: 'Quick-dry towel', nameHe: 'מגבת מתייבשת מהר' },
      { id: 'a2', name: 'Waterproof phone case', nameHe: 'כיסוי עמיד למים לטלפון' },
      { id: 'a3', name: 'Sunglasses (with strap)', nameHe: 'משקפי שמש (עם רצועה)' },
      { id: 'a4', name: 'Snorkeling gear', nameHe: 'ציוד שנירקול' },
      { id: 'a5', name: 'Flashlight / headlamp', nameHe: 'פנס / פנס ראש' },
      { id: 'a6', name: 'Ziplock bags', nameHe: 'שקיות ג\'ל' },
    ],
  },
  {
    id: 'snacks',
    name: 'Snacks & Comfort',
    nameHe: 'חטיפים ונוחות',
    emoji: '🍫',
    items: [
      { id: 's1', name: 'Snacks for flights', nameHe: 'חטיפים לטיסות' },
      { id: 's2', name: 'Neck pillow', nameHe: 'כרית צוואר' },
      { id: 's3', name: 'Books / Kindle', nameHe: 'ספרים / קינדל' },
      { id: 's4', name: 'Card games', nameHe: 'משחקי קלפים' },
      { id: 's5', name: 'Earplugs + eye mask', nameHe: 'אטמי אוזניים + מסיכת עיניים' },
    ],
  },
]

interface PackingConfig {
  customItems: { id: string; categoryId: string; name: string; nameHe: string }[]
  removedIds: string[]
}

const FAMILY_COUNT = 5

export default function PackingPage() {
  const { t } = useLang()
  const { member } = useAuth()
  const [checks, setChecks] = useSharedState<Record<string, string[]>>('packing-v2', {})
  const [packingConfig] = useSharedState<PackingConfig>('packing-config', { customItems: [], removedIds: [] })
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const categories = CATEGORIES.map(cat => {
    const filteredItems = cat.items.filter(i => !packingConfig.removedIds.includes(i.id))
    const customForCat = packingConfig.customItems
      .filter(ci => ci.categoryId === cat.id)
      .map(ci => ({ id: ci.id, name: ci.name, nameHe: ci.nameHe }))
    return { ...cat, items: [...filteredItems, ...customForCat] }
  })

  const allItems = categories.flatMap(c => c.items)

  const myId = member?.id || 'unknown'

  const isCheckedByMe = (itemId: string) =>
    (checks[itemId] || []).includes(myId)

  const checkedCount = (itemId: string) =>
    (checks[itemId] || []).length

  const toggleItem = (itemId: string) => {
    setChecks(prev => {
      const current = prev[itemId] || []
      if (current.includes(myId)) {
        return { ...prev, [itemId]: current.filter(id => id !== myId) }
      } else {
        return { ...prev, [itemId]: [...current, myId] }
      }
    })
  }

  const resetAll = () => {
    setChecks({})
  }

  const myCheckedCount = allItems.filter(i => isCheckedByMe(i.id)).length
  const totalItems = allItems.length
  const progress = totalItems > 0 ? (myCheckedCount / totalItems) * 100 : 0

  return (
    <div className="packing-page">
      <h2 className="page-title">{t('🧳 רשימת ארוז', '🧳 Packing List')}</h2>

      <div className="packing-progress">
        <div className="packing-progress-header">
          <span>{t('ארזתי', 'My progress')}</span>
          <span className="packing-progress-count">{myCheckedCount}/{totalItems}</span>
        </div>
        <div className="packing-progress-bar">
          <div className="packing-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {progress === 100 && (
          <p className="packing-done">{t('✅ הכל ארוז! מוכנים לטוס!', '✅ All packed! Ready to fly!')}</p>
        )}
      </div>

      <div className="packing-categories">
        {categories.map(cat => {
          const catMyChecked = cat.items.filter(i => isCheckedByMe(i.id)).length
          const isExpanded = expandedCat === cat.id
          return (
            <div key={cat.id} className={`packing-cat ${isExpanded ? 'expanded' : ''}`}>
              <button className="packing-cat-header" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                <span className="packing-cat-emoji">{cat.emoji}</span>
                <span className="packing-cat-name">{t(cat.nameHe, cat.name)}</span>
                <span className={`packing-cat-count ${catMyChecked === cat.items.length ? 'complete' : ''}`}>
                  {catMyChecked}/{cat.items.length}
                </span>
                <span className="packing-cat-chevron">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="packing-items">
                  {cat.items.map(item => {
                    const myCheck = isCheckedByMe(item.id)
                    const count = checkedCount(item.id)
                    return (
                      <label key={item.id} className={`packing-item ${myCheck ? 'checked' : ''}`}>
                        <div className={`packing-checkbox ${myCheck ? 'checked' : ''}`}>
                          {myCheck && <Check size={14} />}
                        </div>
                        <span className="packing-item-name">{t(item.nameHe, item.name)}</span>
                        {count > 0 && (
                          <span className={`packing-member-count ${count === FAMILY_COUNT ? 'all' : ''}`}>
                            {count}/{FAMILY_COUNT}
                          </span>
                        )}
                        <input
                          type="checkbox"
                          checked={myCheck}
                          onChange={() => toggleItem(item.id)}
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button className="packing-reset" onClick={resetAll}>
        <RotateCcw size={16} />
        {t('אפס הכל', 'Reset All')}
      </button>
    </div>
  )
}
