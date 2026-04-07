import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { LanguageToggle } from '../components/SharedComponents'
import { sendDemoOtp, verifyDemoOtp, getUserProfile, createUserProfile } from '../lib/db'

export default function LoginPage() {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [demoOtp, setDemoOtp] = useState('')
  const { lang, toggleLang, t } = useLang()
  const { login, user } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(t => t - 1), 1000)
      return () => clearTimeout(id)
    }
  }, [timer])

  const handleSendOtp = async () => {
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toastError(t('errors.invalidPhone'))
      return
    }
    setLoading(true)
    try {
      const generated = sendDemoOtp(phone)
      setDemoOtp(generated)
      setStep('otp')
      setTimer(300)
      success(`OTP: ${generated} (Demo Mode)`)
    } catch {
      toastError(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val
    setOtp(newOtp)
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 0) return
    const newOtp = [...otp]
    text.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    document.getElementById(`otp-${Math.min(text.length, 5)}`)?.focus()
  }

  const handleVerify = async () => {
    const enteredOtp = otp.join('')
    if (enteredOtp.length !== 6) {
      toastError(t('errors.invalidOtp'))
      return
    }
    setLoading(true)
    try {
      const valid = verifyDemoOtp(phone, enteredOtp)
      if (!valid) {
        toastError(t('errors.invalidOtp'))
        return
      }

      // Check if user exists
      const { data: existingUser } = await getUserProfile(phone)

      if (existingUser) {
        await login({ id: existingUser.id, phone }, existingUser)
        navigate('/')
      } else {
        // New user - go to onboarding
        navigate('/onboarding', { state: { phone } })
      }
    } catch {
      toastError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      // Quick login with demo profile, bypass OTP
      const demoProfile = {
        id: `demo-${Date.now()}`,
        name: 'Demo Farmer',
        phone: '9999999999',
        role: 'farmer',
        created_at: new Date().toISOString(),
      }
      await login({ id: demoProfile.id, phone: demoProfile.phone }, demoProfile)
      navigate('/')
    } catch {
      toastError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
        <LanguageToggle lang={lang} onToggle={toggleLang} />
      </div>

      {/* Hero section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem', animation: 'bounce 2s ease-in-out infinite' }}>🌾</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: '0.25rem', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          {t('appName')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '3rem', textAlign: 'center' }}>
          {t('appTagline')}
        </p>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2rem',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {step === 'phone' ? (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1b4332' }}>
                {t('loginTitle')}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {t('loginSubtitle')}
              </p>

              <div className="form-group">
                <label className="form-label">{t('mobileNumber')}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#475569', fontWeight: 600, fontSize: '0.95rem'
                  }}>🇮🇳 +91</span>
                  <input
                    className="form-control"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder={t('mobilePlaceholder')}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '80px' }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    id="phone-input"
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                id="send-otp-btn"
              >
                {loading ? <span className="spinner spinner-sm"></span> : null}
                {t('sendOtp')} →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('phone')}
                style={{ background: 'none', border: 'none', color: '#2d6a4f', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← {lang === 'hi' ? 'वापस जाएं' : 'Go back'}
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1b4332' }}>
                {t('enterOtp')}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {t('otpSubtitle')} <strong>+91 {phone}</strong>
              </p>

              <div className="otp-container" style={{ marginBottom: '1.5rem' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    className="otp-input form-control"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Demo OTP hint */}
              {demoOtp && (
                <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '0.75rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#92400e' }}>
                  🔐 Demo OTP: <strong style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>{demoOtp}</strong>
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleVerify}
                disabled={loading || otp.join('').length !== 6}
                id="verify-otp-btn"
              >
                {loading ? <span className="spinner spinner-sm"></span> : null}
                {t('verify')} ✓
              </button>

              <button
                className="btn btn-ghost btn-block"
                style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}
                onClick={() => {
                  if (timer === 0) {
                    const generated = sendDemoOtp(phone)
                    setDemoOtp(generated)
                    setTimer(300)
                    success(`New OTP: ${generated}`)
                  }
                }}
                disabled={timer > 0}
              >
                {timer > 0 ? `${t('resendOtp')} (${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')})` : t('resendOtp')}
              </button>
            </>
          )}
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {(lang === 'hi' 
            ? ['🌾 सीधे किसान से', '💰 बेहतर कीमत', '🚚 डिलीवरी सुविधा']
            : ['🌾 Direct from Farmer', '💰 Better Prices', '🚚 Delivery Available']
          ).map(feature => (
            <div key={feature} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 600 }}>
              {feature}
            </div>
          ))}
        </div>

        {/* Quick Demo Login */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          id="demo-login-btn"
          style={{
            marginTop: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.4)',
            borderRadius: '12px', padding: '0.75rem 1.5rem', color: 'rgba(255,255,255,0.9)',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
          }}
        >
          🚀 {lang === 'hi' ? 'डेमो अकाउंट से लॉगिन' : 'Quick Demo Login'}
        </button>
      </div>
    </div>
  )
}
