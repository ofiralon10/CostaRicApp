import { Phone, Shield, Building2, Users, AlertTriangle } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { emergencyContacts } from '../data/emergency'

const typeIcons = {
  emergency: AlertTriangle,
  embassy: Building2,
  hotel: Phone,
  guide: Users,
  family: Users,
}

const typeColors = {
  emergency: '#dc2626',
  embassy: '#2563eb',
  hotel: '#16a34a',
  guide: '#ea580c',
  family: '#7c3aed',
}

const typeLabels = {
  emergency: { he: 'חירום', en: 'Emergency' },
  embassy: { he: 'שגרירות', en: 'Embassy' },
  hotel: { he: 'מלון', en: 'Hotel' },
  guide: { he: 'מדריך', en: 'Guide' },
  family: { he: 'משפחה', en: 'Family' },
}

export default function EmergencyPage() {
  const { t } = useLang()

  const grouped = emergencyContacts.reduce(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = []
      acc[c.type].push(c)
      return acc
    },
    {} as Record<string, typeof emergencyContacts>,
  )

  return (
    <div className="emergency-page">
      <div className="emergency-header">
        <Shield size={32} />
        <h2>{t('מידע לשעת חירום', 'Emergency Info')}</h2>
      </div>

      {Object.entries(grouped).map(([type, contacts]) => {
        const Icon = typeIcons[type as keyof typeof typeIcons]
        const color = typeColors[type as keyof typeof typeColors]
        const label = typeLabels[type as keyof typeof typeLabels]

        return (
          <div key={type} className="emergency-group">
            <div className="emergency-group-header" style={{ color }}>
              <Icon size={20} />
              <h3>{t(label.he, label.en)}</h3>
            </div>
            {contacts.map((c, i) => (
              <div key={i} className="emergency-contact">
                <span className="contact-name">{t(c.nameHe, c.name)}</span>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="contact-phone" style={{ color }}>
                    <Phone size={16} />
                    {c.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      })}

      <div className="emergency-tips">
        <h3>{t('טיפים חשובים', 'Important Tips')}</h3>
        <ul>
          <li>{t('שמרו על צילום של הדרכון בטלפון', 'Keep a photo of your passport on your phone')}</li>
          <li>{t('מספר חירום בקוסטה ריקה: 911', 'Costa Rica emergency number: 911')}</li>
          <li>{t('מספר חירום בספרד: 112', 'Spain emergency number: 112')}</li>
          <li>{t('ודאו שיש לכם ביטוח נסיעות פעיל', 'Make sure your travel insurance is active')}</li>
        </ul>
      </div>
    </div>
  )
}
