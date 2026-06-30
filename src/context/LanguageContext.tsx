import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Language } from '../data/types'

interface LanguageContextType {
  lang: Language
  toggleLang: () => void
  t: (he: string, en: string) => string
  isRtl: boolean
}

const LanguageContext = createContext<LanguageContextType>(null!)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('he')

  const toggleLang = () => setLang(l => (l === 'he' ? 'en' : 'he'))
  const t = (he: string, en: string) => (lang === 'he' ? he : en)
  const isRtl = lang === 'he'

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isRtl }}>
      <div dir={isRtl ? 'rtl' : 'ltr'} style={{ fontFamily: isRtl ? "'Heebo', sans-serif" : "'Inter', sans-serif" }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
