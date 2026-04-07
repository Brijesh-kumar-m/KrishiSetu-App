import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const ROLE_INFO = {
  farmer: { emoji: '👨‍🌾', hi: 'किसान', en: 'Farmer' },
  trader: { emoji: '🏪', hi: 'व्यापारी', en: 'Trader' },
  customer: { emoji: '🛍️', hi: 'ग्राहक', en: 'Customer' },
}

export default function ProfilePage() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { lang, toggleLang, t } = useLang()
  const { profile, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const roleInfo = ROLE_INFO[profile?.role] || ROLE_INFO.customer

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    toast.success(lang === 'hi' ? 'लॉगआउट सफल' : 'Logged out successfully')
  }

  const menuItems = [
    {
      icon: '🛒', hiLabel: 'खरीदे हुए ऑर्डर', enLabel: 'My Purchases',
      onClick: () => navigate('/orders')
    },
    ...(profile?.role === 'farmer' ? [{
      icon: '🌾', hiLabel: 'मेरी लिस्टिंग', enLabel: 'My Listings',
      onClick: () => navigate('/dashboard')
    }] : []),
    {
      icon: '📊', hiLabel: 'डैशबोर्ड', enLabel: 'Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      icon: '🌐', hiLabel: lang === 'hi' ? 'अंग्रेजी में बदलें' : 'Switch to Hindi', enLabel: lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें',
      onClick: toggleLang, badge: lang === 'hi' ? 'EN' : 'हिं'
    },
    {
      icon: '💬', hiLabel: 'हमसे संपर्क करें', enLabel: 'Contact Us',
      onClick: () => window.open('https://chat.whatsapp.com/', '_blank')
    },
    {
      icon: '📱', hiLabel: 'App शेयर करें', enLabel: 'Share App',
      onClick: () => {
        if (navigator.share) {
          navigator.share({
            title: 'KrishiSetu - कृषि सेतु',
            text: lang === 'hi' ? 'किसानों से सीधे फसल खरीदें!' : 'Buy crops directly from farmers!',
            url: window.location.origin
          })
        } else {
          navigator.clipboard.writeText(window.location.origin)
          toast.success(lang === 'hi' ? 'लिंक कॉपी हो गया!' : 'Link copied!')
        }
      }
    },
    {
      icon: '❓', hiLabel: 'सहायता', enLabel: 'Help',
      onClick: () => {
        toast.info(lang === 'hi' ? 'हम जल्द यह फीचर लाएंगे' : 'Help section coming soon')
      }
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1 className="page-title">👤 {t('profileTitle')}</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Profile Card */}
        <div style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', borderRadius: '20px', padding: '1.5rem', color: '#fff', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '8rem', opacity: 0.06 }}>
            {roleInfo.emoji}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile?.name || 'User'}</div>
              <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '4px' }}>
                {roleInfo.emoji} {lang === 'hi' ? roleInfo.hi : roleInfo.en}
              </div>
              <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                📱 +91{profile?.phone}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '0', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
            {[
              { icon: '📦', hiLabel: 'ऑर्डर', enLabel: 'Orders', value: '—' },
              { icon: '⭐', hiLabel: 'रेटिंग', enLabel: 'Rating', value: '—' },
              { icon: '📅', hiLabel: 'सदस्य', enLabel: 'Member', value: profile?.created_at ? new Date(profile.created_at).getFullYear().toString() : '—' },
            ].map((stat, idx) => (
              <div key={stat.icon} style={{ flex: 1, padding: '0.75rem 0.5rem', textAlign: 'center', borderLeft: idx > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                  {stat.icon} {lang === 'hi' ? stat.hiLabel : stat.enLabel}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '1rem' }}>
          {menuItems.map((item, idx) => (
            <div key={idx}>
              {idx > 0 && <div style={{ height: '1px', background: '#f1f5f9', marginLeft: '56px' }}></div>}
              <button
                onClick={item.onClick}
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '1.5rem', width: '32px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
                  {lang === 'hi' ? item.hiLabel : item.enLabel}
                </span>
                {item.badge && (
                  <span className="badge badge-primary">{item.badge}</span>
                )}
                <span style={{ color: '#94a3b8' }}>›</span>
              </button>
            </div>
          ))}
        </div>

        {/* App Info */}
        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🌾</div>
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>KrishiSetu v1.0.0</div>
          <div>{lang === 'hi' ? 'किसानों का अपना बाजार' : "Farmer's Digital Marketplace"}</div>
          <div style={{ marginTop: '4px' }}>
            {lang === 'hi' ? 'Made with ❤️ for India\'s farmers' : 'Made with ❤️ for Indian farmers'}
          </div>
        </div>

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button
            className="btn btn-block"
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 700, marginBottom: '1rem' }}
            onClick={() => setShowLogoutConfirm(true)}
            id="logout-btn"
          >
            🚪 {t('logout')}
          </button>
        ) : (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-md)', marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.75rem' }}>
              {t('logoutConfirm')}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>
                {t('no')}
              </button>
              <button className="btn" style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 700, cursor: 'pointer' }} onClick={handleLogout} id="confirm-logout-btn">
                {t('yes')}, {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
