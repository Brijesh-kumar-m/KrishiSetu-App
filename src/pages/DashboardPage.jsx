import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getUserProducts, getSellerOrders, getBuyerOrders, deleteProduct } from '../lib/db'
import { OrderStatusBadge } from '../components/SharedComponents'
import { translations, cropEmojis } from '../lib/translations'

export default function DashboardPage() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [buyOrders, setBuyOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { lang, t } = useLang()
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const isFarmer = profile?.role === 'farmer'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, sOrders, bOrders] = await Promise.all([
        isFarmer ? getUserProducts(profile?.id) : Promise.resolve([]),
        isFarmer ? getSellerOrders(profile?.id) : Promise.resolve([]),
        getBuyerOrders(profile?.id),
      ])
      setProducts(prods || [])
      setOrders(sOrders || [])
      setBuyOrders(bOrders || [])
    } catch {
      setProducts([])
      setOrders([])
      setBuyOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm(lang === 'hi' ? 'इस लिस्टिंग को हटाएं?' : 'Delete this listing?')) return
    try {
      await deleteProduct(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast.success(lang === 'hi' ? 'लिस्टिंग हटा दी गई' : 'Listing deleted')
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const totalEarnings = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_price, 0)
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h1 className="page-title">📊 {t('dashboardTitle')}</h1>
          </div>
        </div>
        <div className="loading-overlay"><div className="spinner"></div></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1 className="page-title">📊 {t('dashboardTitle')}</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Welcome Card */}
        <div style={{ background: 'linear-gradient(135deg, #1b4332, #2d6a4f)', borderRadius: '20px', padding: '1.25rem', color: '#fff', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '1.5rem', width: 56, height: 56 }}>
              {profile?.role === 'farmer' ? '👨‍🌾' : profile?.role === 'trader' ? '🏪' : '🛍️'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile?.name}</div>
              <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {profile?.role === 'farmer' ? (lang === 'hi' ? 'किसान' : 'Farmer')
                 : profile?.role === 'trader' ? (lang === 'hi' ? 'व्यापारी' : 'Trader')
                 : (lang === 'hi' ? 'ग्राहक' : 'Customer')}
                {' '}• 📞 +91{profile?.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid (Farmer) */}
        {isFarmer && (
          <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
              <div className="stat-label">
                💰 {lang === 'hi' ? 'कुल कमाई' : 'Total Earnings'}
              </div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value">{products.length}</div>
              <div className="stat-label">
                📋 {lang === 'hi' ? 'लिस्टिंग' : 'Listings'}
              </div>
            </div>
            <div className="stat-card gold">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">
                📦 {lang === 'hi' ? 'कुल ऑर्डर' : 'Total Orders'}
              </div>
            </div>
            <div className="stat-card earth">
              <div className="stat-value">{pendingOrdersCount}</div>
              <div className="stat-label">
                ⏳ {lang === 'hi' ? 'प्रतीक्षारत' : 'Pending'}
              </div>
            </div>
          </div>
        )}

        {/* Buyer Stats */}
        {!isFarmer && (
          <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-value">{buyOrders.length}</div>
              <div className="stat-label">📦 {lang === 'hi' ? 'कुल ऑर्डर' : 'Total Orders'}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-value">₹{buyOrders.reduce((s, o) => s + o.total_price, 0).toLocaleString()}</div>
              <div className="stat-label">💰 {lang === 'hi' ? 'कुल खर्च' : 'Total Spent'}</div>
            </div>
          </div>
        )}

        {/* Farmer: My Listings */}
        {isFarmer && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="section-title">
              <h2>🌾 {t('myListings')}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/sell')}>
                + {lang === 'hi' ? 'जोड़ें' : 'Add'}
              </button>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '16px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌾</div>
                <div style={{ fontWeight: 600, color: '#64748b' }}>
                  {lang === 'hi' ? 'कोई लिस्टिंग नहीं' : 'No listings yet'}
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/sell')}>
                  + {lang === 'hi' ? 'पहली लिस्टिंग बनाएं' : 'Create first listing'}
                </button>
              </div>
            ) : (
              products.map(product => {
                const emoji = cropEmojis[product.crop_name] || '🌱'
                const cropName = lang === 'hi'
                  ? translations.hi.crops[product.crop_name] || product.crop_name
                  : translations.en.crops[product.crop_name] || product.crop_name

                return (
                  <div key={product.id} style={{ background: '#fff', borderRadius: '16px', padding: '1rem', marginBottom: '0.75rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                      {emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{cropName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {product.quantity} {product.unit} • ₹{product.price}/{product.unit}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📍 {product.location}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.85rem', padding: '8px 14px', color: '#ef4444', background: '#fee2e2', minHeight: '44px', minWidth: '44px' }}
                        onClick={() => handleDelete(product.id)}
                        aria-label={lang === 'hi' ? 'हटाएं' : 'Delete'}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Pending Orders (Farmer) */}
        {isFarmer && orders.filter(o => o.status === 'pending').length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="section-title">
              <h2>⏳ {lang === 'hi' ? 'नए ऑर्डर' : 'New Orders'}</h2>
              <button className="see-all" onClick={() => navigate('/orders')}>
                {lang === 'hi' ? 'सभी →' : 'All →'}
              </button>
            </div>
            {orders.filter(o => o.status === 'pending').slice(0, 3).map(order => (
              <div key={order.id} style={{ background: '#fffbeb', borderRadius: '12px', padding: '0.875rem', marginBottom: '0.5rem', border: '1px solid #fde68a', cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${order.id}`, { state: { order } })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>
                      {(order.buyer?.name) || (lang === 'hi' ? 'खरीदार' : 'Buyer')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                      ₹{order.total_price?.toLocaleString()} • {order.quantity} units
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} t={t} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Purchases (All) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">
            <h2>🛒 {lang === 'hi' ? 'हाल की खरीदी' : 'Recent Purchases'}</h2>
            <button className="see-all" onClick={() => navigate('/orders')}>
              {lang === 'hi' ? 'सभी →' : 'All →'}
            </button>
          </div>

          {buyOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</div>
              <div style={{ fontWeight: 600, color: '#64748b' }}>
                {lang === 'hi' ? 'कोई खरीदी नहीं' : 'No purchases yet'}
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/buy')}>
                {lang === 'hi' ? 'अभी खरीदें' : 'Start Shopping'}
              </button>
            </div>
          ) : (
            buyOrders.slice(0, 3).map(order => (
              <div key={order.id} style={{ background: '#fff', borderRadius: '12px', padding: '0.875rem', marginBottom: '0.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${order.id}`, { state: { order } })}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                    {lang === 'hi' ? translations.hi.crops[order.products?.crop_name] : translations.en.crops[order.products?.crop_name]} • {order.products?.crop_name && `${cropEmojis[order.products.crop_name] || '🌾'}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    ₹{order.total_price?.toLocaleString()}
                  </div>
                </div>
                <OrderStatusBadge status={order.status} t={t} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
