import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import translations from '../lib/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('ks_lang') || 'hi'
  })

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'hi' ? 'en' : 'hi'
      localStorage.setItem('ks_lang', next)
      return next
    })
  }, [])

  // Sync HTML lang attribute and body class for CSS selectors + screen readers
  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en'
    document.body.classList.toggle('lang-en', lang === 'en')
  }, [lang])

  const t = useCallback((key) => {
    const keys = key.split('.')
    let result = translations[lang]
    for (const k of keys) {
      result = result?.[k]
    }
    return result || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be within LanguageProvider')
  return ctx
}
