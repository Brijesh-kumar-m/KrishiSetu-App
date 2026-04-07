import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getBuyerOrders, getSellerOrders, updateOrderStatus } from '../lib/db'
import { OrderStatusBadge } from '../components/SharedComponents'
import { translations } from '../lib/translations'

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'delivered', 'rejected']

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('buyer') // 'buyer' | 'seller'
  const [statusFilter, setStatusFilter] = useState('all')
  const { lang, t } = useLang()
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const isFarmer = profile?.role === 'farmer'

  useEffect(() => {
    loadOrders()
  }, [viewMode])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const fn = viewMode === 'buyer' ? getBuyerOrders : getSellerOrders
      const data = await fn(profile?.id)
      setOrders(data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      toast.success(lang === 'hi' ? 'ऑर्डर स्थिति अपडेट हुई' : 'Order status updated')
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  const getStatusIcon = (status) => {
    const icons = { pending: '⏳', accepted: '✅', delivered: '🚚', rejected: '❌' }
    return icons[status] || '📦'
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1 className="page-title">📦 {t('ordersTitle')}</h1>
        </div>

        {/* Buyer/Seller Toggle */}
        {isFarmer && (
          <div style={{ display: 'flex', marginTop: '0.75rem', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '3px', gap: '3px' }}>
            <button
              onClick={() => setViewMode('buyer')}
              style={{ flex: 1, padding: '6px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', background: viewMode === 'buyer' ? '#fff' : 'transparent', color: viewMode === 'buyer' ? 'var(--primary-dark)' : 'rgba(255,255,255,0.8)' }}
            >
              🛒 {lang === 'hi' ? 'खरीदी' : 'Purchases'}
            </button>
            <button
              onClick={() => setViewMode('seller')}
              style={{ flex: 1, padding: '6px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', background: viewMode === 'seller' ? '#fff' : 'transparent', color: viewMode === 'seller' ? 'var(--primary-dark)' : 'rgba(255,255,255,0.8)' }}
            >
              🌾 {lang === 'hi' ? 'बिक्री' : 'Sales'}
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Status Filter */}
        <div className="filter-chips" style={{ marginBottom: '1rem' }}>
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              className={`chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? (lang === 'hi' ? 'सभी' : 'All') : (
                `${getStatusIcon(status)} ${t(status)}`
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '4rem' }}>📦</div>
            <h3>{lang === 'hi' ? 'कोई ऑर्डर नहीं' : 'No orders found'}</h3>
            <p>{lang === 'hi' ? 'अभी तक कोई ऑर्डर नहीं है' : 'No orders yet'}</p>
            {viewMode === 'buyer' && (
              <button className="btn btn-primary" onClick={() => navigate('/buy')}>
                🌾 {lang === 'hi' ? 'खरीदें' : 'Start Shopping'}
              </button>
            )}
          </div>
        ) : (
          filtered.map(order => {
            const product = order.products
            const cropName = product
              ? (lang === 'hi'
                ? translations.hi.crops[product.crop_name] || product.crop_name
                : translations.en.crops[product.crop_name] || product.crop_name)
              : (lang === 'hi' ? 'फसल' : 'Crop')

            const person = viewMode === 'buyer' ? order.seller : order.buyer
            const personLabel = viewMode === 'buyer'
              ? (lang === 'hi' ? 'विक्रेता' : 'Seller')
              : (lang === 'hi' ? 'खरीदार' : 'Buyer')

            return (
              <div
                key={order.id}
                style={{
                  background: '#fff', borderRadius: '16px', padding: '1rem',
                  marginBottom: '0.75rem', boxShadow: 'var(--shadow-md)', cursor: 'pointer',
                }}
                onClick={() => navigate(`/orders/${order.id}`, { state: { order } })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '2px' }}>
                      🌾 {cropName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      #{order.id?.slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} t={t} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {personLabel}: {person?.name || '—'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      📅 {new Date(order.created_at).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d6a4f' }}>
                    ₹{order.total_price?.toLocaleString()}
                  </div>
                </div>

                {/* Seller Actions */}
                {viewMode === 'seller' && order.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleStatusUpdate(order.id, 'accepted')}
                    >
                      ✅ {t('accept')}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ flex: 1, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleStatusUpdate(order.id, 'rejected')}
                    >
                      ❌ {t('reject')}
                    </button>
                  </div>
                )}

                {viewMode === 'seller' && order.status === 'accepted' && (
                  <button
                    className="btn btn-primary btn-sm btn-block"
                    onClick={e => { e.stopPropagation(); handleStatusUpdate(order.id, 'delivered') }}
                  >
                    🚚 {t('markDelivered')}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
