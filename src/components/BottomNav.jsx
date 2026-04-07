import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()
  const { cartCount } = useCart()
  const { profile } = useAuth()

  const isFarmer = profile?.role === 'farmer'

  const items = [
    { path: '/', icon: '🏠', label: t('home') },
    { path: '/buy', icon: '🛒', label: t('buy') },
    ...(isFarmer ? [{ path: '/sell', icon: '🌾', label: t('sell') }] : []),
    { path: '/orders', icon: '📦', label: t('orders') },
    { path: '/dashboard', icon: '📊', label: t('dashboard') },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">
            {item.icon}
            {item.path === '/buy' && cartCount > 0 && (
              <span className="nav-badge">{cartCount}</span>
            )}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
      <button
        className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">{t('profile')}</span>
      </button>
    </nav>
  )
}
