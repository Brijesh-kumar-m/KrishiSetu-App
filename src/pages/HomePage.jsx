import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { LanguageToggle } from '../components/SharedComponents'
import { getProducts } from '../lib/db'
import { cropEmojis, translations } from '../lib/translations'

const QUICK_ACTIONS = [
  { icon: '🛒', hiLabel: 'फसल खरीदें', enLabel: 'Buy Crops', path: '/buy', color: '#2d6a4f', bg: 'linear-gradient(135deg, #1b4332, #2d6a4f)' },
  { icon: '🌾', hiLabel: 'फसल बेचें', enLabel: 'Sell Crops', path: '/sell', color: '#e07543', bg: 'linear-gradient(135deg, #e07543, #f4a261)', roles: ['farmer'] },
  { icon: '📦', hiLabel: 'मेरे ऑर्डर', enLabel: 'My Orders', path: '/orders', color: '#3b82f6', bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' },
  { icon: '📊', hiLabel: 'डैशबोर्ड', enLabel: 'Dashboard', path: '/dashboard', color: '#7c3aed', bg: 'linear-gradient(135deg, #6d28d9, #7c3aed)' },
]

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const { lang, toggleLang, t } = useLang()
  const { profile } = useAuth()
  const { cartCount, addToCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadProducts()
    const handleInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data.slice(0, 6))
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt()
      setInstallPrompt(null)
    }
  }

  const isFarmer = profile?.role === 'farmer'
  const visibleActions = QUICK_ACTIONS.filter(a => !a.roles || a.roles.includes(profile?.role))

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1.5rem' }}>🌾</span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {t('appName')}
                </span>
              </div>
              {profile?.name && (
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>
                  {lang === 'hi' ? `नमस्ते, ${profile.name} 👋` : `Hello, ${profile.name} 👋`}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LanguageToggle lang={lang} onToggle={toggleLang} />
              <button
                onClick={() => navigate('/cart')}
                style={{ position: 'relative', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                🛒
                {cartCount > 0 && (
                  <span className="nav-badge">{cartCount}</span>
                )}
              </button>
            </div>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '0.5rem' }}>
            {lang === 'hi'
              ? 'बिना बिचौलिए\nफसल बेचें और खरीदें'
              : 'Buy & Sell Crops\nDirectly from Farmers'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
            {lang === 'hi' ? 'किसानों से सीधे, ज्यादा मुनाफा' : 'No middlemen, more profit'}
          </p>
        </div>

        {/* Floating crop decorations */}
        <div style={{ position: 'absolute', right: '20px', top: '20px', opacity: 0.15, fontSize: '5rem', transform: 'rotate(15deg)' }}>🌾</div>
        <div style={{ position: 'absolute', right: '60px', bottom: '10px', opacity: 0.1, fontSize: '4rem' }}>🌽</div>
      </div>

      {/* PWA Install Banner */}
      {installPrompt && (
        <div className="install-banner" style={{ margin: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📱</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {lang === 'hi' ? 'App इंस्टॉल करें' : 'Install App'}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
              {lang === 'hi' ? 'बेहतर अनुभव के लिए' : 'For better experience'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }} onClick={handleInstall}>
            {lang === 'hi' ? 'इंस्टॉल' : 'Install'}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ padding: '1.25rem 1rem 0.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.75rem' }}>
          {lang === 'hi' ? '⚡ क्या करना चाहते हैं?' : '⚡ Quick Actions'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {visibleActions.map(action => (
            <button
              key={action.path}
              id={`action-${action.path.replace('/', '')}`}
              onClick={() => navigate(action.path)}
              style={{
                background: action.bg,
                border: 'none',
                borderRadius: '16px',
                padding: '1.25rem 1rem',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{action.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {lang === 'hi' ? action.hiLabel : action.enLabel}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      <div style={{ margin: '1rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '16px', padding: '1rem', display: 'flex', justifyContent: 'space-around', border: '1px solid #bbf7d0' }}>
        {[
          { num: '5L+', hiLabel: 'किसान', enLabel: 'Farmers' },
          { num: '50+', hiLabel: 'फसलें', enLabel: 'Crops' },
          { num: '10L+', hiLabel: 'ट्रांजेक्शन', enLabel: 'Transactions' },
        ].map(stat => (
          <div key={stat.num} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2d6a4f' }}>{stat.num}</div>
            <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
              {lang === 'hi' ? stat.hiLabel : stat.enLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Popular Crops Chips */}
      <div style={{ padding: '0 1rem 0.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.75rem' }}>
          🌾 {lang === 'hi' ? 'लोकप्रिय फसलें' : 'Popular Crops'}
        </h2>
        <div className="filter-chips">
          {Object.entries(cropEmojis).slice(0, 8).map(([key, emoji]) => (
            <button
              key={key}
              className="chip"
              onClick={() => navigate(`/buy?crop=${key}`)}
            >
              {emoji} {lang === 'hi'
                ? translations.hi.crops[key]
                : translations.en.crops[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Products */}
      <div style={{ padding: '0.5rem 1rem' }}>
        <div className="section-title">
          <h2>🔥 {lang === 'hi' ? 'ताज़ी लिस्टिंग' : 'Fresh Listings'}</h2>
          <button className="see-all" onClick={() => navigate('/buy')}>
            {lang === 'hi' ? 'सभी देखें →' : 'See all →'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 140 }}></div>
                <div style={{ padding: '0.75rem' }}>
                  <div className="skeleton" style={{ height: 16, marginBottom: 8 }}></div>
                  <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }}></div>
                  <div className="skeleton" style={{ height: 36 }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌾</div>
            <h3>{lang === 'hi' ? 'अभी कोई लिस्टिंग नहीं' : 'No listings yet'}</h3>
            {isFarmer && (
              <button className="btn btn-primary" onClick={() => navigate('/sell')}>
                + {t('sellCrops')}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {products.map(product => {
              const emoji = cropEmojis[product.crop_name] || '🌱'
              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="product-img-placeholder" style={{ height: 120 }}>
                    <span style={{ fontSize: '3rem' }}>{emoji}</span>
                  </div>
                  <div style={{ padding: '0.6rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: 2 }}>
                      {emoji} {lang === 'hi'
                        ? translations.hi.crops[product.crop_name] || product.crop_name
                        : translations.en.crops[product.crop_name] || product.crop_name}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d6a4f', marginBottom: 2 }}>
                      ₹{product.price}
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                        /{product.unit === 'kg' ? 'kg' : 'q'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      📍 {product.location}
                    </div>
                    <button
                      className="btn btn-primary btn-sm btn-block"
                      style={{ fontSize: '0.75rem', padding: '6px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(product)
                        toast.success(lang === 'hi' ? 'कार्ट में जोड़ा गया!' : 'Added to cart!')
                      }}
                    >
                      🛒 {lang === 'hi' ? 'जोड़ें' : 'Add'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Community Banner */}
      <div style={{ margin: '1rem', background: 'linear-gradient(135deg, #25d366, #128c7e)', borderRadius: '16px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => window.open('https://chat.whatsapp.com/', '_blank')}>
        <span style={{ fontSize: '2rem' }}>💬</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
            {lang === 'hi' ? 'WhatsApp ग्रुप से जुड़ें' : 'Join WhatsApp Group'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
            {lang === 'hi' ? 'किसानों के साथ जुड़ें' : 'Connect with farmers'}
          </div>
        </div>
        <span style={{ marginLeft: 'auto', color: '#fff', fontSize: '1.2rem' }}>→</span>
      </div>
    </div>
  )
}
