import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { createUserProfile } from '../lib/db'

const ROLES = [
  { key: 'farmer', emoji: '👨‍🌾', hiName: 'किसान', enName: 'Farmer', hiDesc: 'फसल बेचें', enDesc: 'Sell crops' },
  { key: 'trader', emoji: '🏪', hiName: 'व्यापारी', enName: 'Trader', hiDesc: 'थोक खरीदें', enDesc: 'Buy wholesale' },
  { key: 'customer', emoji: '🛍️', hiName: 'ग्राहक', enName: 'Customer', hiDesc: 'खरीदारी करें', enDesc: 'Buy retail' },
]

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const { lang, t } = useLang()
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const phone = location.state?.phone || '9999999999'

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('errors.required'))
      return
    }
    if (!role) {
      toast.error(lang === 'hi' ? 'कृपया अपनी भूमिका चुनें' : 'Please select your role')
      return
    }

    setLoading(true)
    try {
      const userData = { name: name.trim(), phone, role }
      const { data, error } = await createUserProfile(userData)
      if (error) throw error

      await login({ id: data.id, phone }, data)
      navigate('/', { replace: true })
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>

      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '2rem' }}>
        <div style={{ width: 32, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.4)' }}></div>
        <div style={{ width: 32, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.9)' }}></div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.97)',
        borderRadius: '24px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginBottom: '0.25rem' }}>
            {t('welcomeTitle')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('welcomeSubtitle')}</p>
        </div>

        {/* Name Input */}
        <div className="form-group">
          <label className="form-label">👤 {t('yourName')}</label>
          <input
            id="name-input"
            className="form-control"
            type="text"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: '1.1rem' }}
          />
        </div>

        {/* Role Selection */}
        <div className="form-group">
          <label className="form-label">🎯 {t('selectRole')}</label>
          <div className="role-grid">
            {ROLES.map(r => (
              <button
                key={r.key}
                id={`role-${r.key}`}
                className={`role-card ${role === r.key ? 'selected' : ''}`}
                onClick={() => setRole(r.key)}
              >
                <span className="role-icon">{r.emoji}</span>
                <span className="role-name">
                  {lang === 'hi' ? r.hiName : r.enName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                  {lang === 'hi' ? r.hiDesc : r.enDesc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          id="continue-btn"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: '1rem' }}
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !role}
        >
          {loading ? <span className="spinner spinner-sm"></span> : null}
          {t('continueBtn')} →
        </button>
      </div>
    </div>
  )
}
