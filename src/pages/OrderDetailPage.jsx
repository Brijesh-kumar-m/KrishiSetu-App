import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { updateOrderStatus, getOrderById } from '../lib/db'
import { OrderStatusBadge } from '../components/SharedComponents'
import { translations } from '../lib/translations'
import { useState, useEffect } from 'react'

export default function OrderDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { lang, t } = useLang()
  const { profile } = useAuth()
  const toast = useToast()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)

  useEffect(() => {
    if (!order) {
      fetchOrder()
    }
  }, [id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const data = await getOrderById(id)
      setOrder(data)
    } catch {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate('/orders')}>←</button>
            <h1 className="page-title">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</h1>
          </div>
        </div>
        <div className="loading-overlay"><div className="spinner"></div></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate('/orders')}>←</button>
            <h1 className="page-title">{lang === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'}</h1>
          </div>
        </div>
        <div className="empty-state"><div className="empty-state-icon">😕</div><h3>{lang === 'hi' ? 'ऑर्डर नहीं मिला' : 'Order not found'}</h3></div>
      </div>
    )
  }

  const isSeller = profile?.id === order.seller_id
  const product = order.products
  const cropName = product
    ? (lang === 'hi' ? translations.hi.crops[product.crop_name] || product.crop_name : translations.en.crops[product.crop_name] || product.crop_name)
    : (lang === 'hi' ? 'फसल' : 'Crop')

  const steps = [
    { key: 'pending', hi: 'ऑर्डर दिया', en: 'Order Placed', icon: '📝' },
    { key: 'accepted', hi: 'ऑर्डर स्वीकार', en: 'Order Accepted', icon: '✅' },
    { key: 'delivered', hi: 'डिलीवर हुआ', en: 'Delivered', icon: '🚚' },
  ]

  const statusOrder = ['pending', 'accepted', 'delivered']
  const currentIdx = statusOrder.indexOf(order.status)

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOrderStatus(order.id, newStatus)
      setOrder(prev => ({ ...prev, status: newStatus }))
      toast.success(lang === 'hi' ? 'स्थिति अपडेट हुई' : 'Status updated')
    } catch {
      toast.error(t('errors.generic'))
    }
  }

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/orders')}>←</button>
          <h1 className="page-title">📦 {lang === 'hi' ? 'ऑर्डर' : 'Order'} #{order.id?.slice(-6).toUpperCase()}</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Status Card */}
        <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1b4332' }}>{cropName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                📅 {new Date(order.created_at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </div>
            </div>
            <OrderStatusBadge status={order.status} t={t} />
          </div>
        </div>

        {/* Tracking Steps */}
        {order.status !== 'rejected' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
              🗺 {lang === 'hi' ? 'ऑर्डर ट्रैकिंग' : 'Order Tracking'}
            </h2>
            <div className="order-steps">
              {steps.map((step, idx) => {
                const done = idx <= currentIdx
                const active = idx === currentIdx
                return (
                  <div key={step.key} className={`order-step ${done ? 'completed' : ''}`}>
                    <div className={`step-dot ${done ? 'completed' : active ? 'active' : ''}`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <div className="step-content">
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: done ? 'var(--primary)' : '#94a3b8' }}>
                        {step.icon} {lang === 'hi' ? step.hi : step.en}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {order.status === 'rejected' && (
          <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', color: '#991b1b', fontWeight: 600, textAlign: 'center' }}>
            ❌ {lang === 'hi' ? 'यह ऑर्डर अस्वीकार कर दिया गया है' : 'This order has been rejected'}
          </div>
        )}

        {/* Order Info */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            📋 {lang === 'hi' ? 'ऑर्डर जानकारी' : 'Order Info'}
          </h2>
          {[
            { label: lang === 'hi' ? 'मात्रा' : 'Quantity', value: `${order.quantity} ${product?.unit || ''}` },
            { label: lang === 'hi' ? 'कुल कीमत' : 'Total Price', value: `₹${order.total_price?.toLocaleString()}` },
            { label: lang === 'hi' ? 'डिलीवरी' : 'Delivery', value: order.delivery_type === 'self_pickup' ? (lang === 'hi' ? 'खुद लेने जाएंगे' : 'Self Pickup') : (lang === 'hi' ? 'विक्रेता डिलीवरी' : 'Seller Delivery') },
            { label: lang === 'hi' ? 'भुगतान' : 'Payment', value: order.payment_method === 'cod' ? (lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery') : 'UPI' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#64748b' }}>{label}</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        {(order.seller || order.buyer) && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            {order.seller && !isSeller && (
              <>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                  👨‍🌾 {lang === 'hi' ? 'विक्रेता संपर्क' : 'Seller Contact'}
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{order.seller.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 +91{order.seller.phone}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = `tel:+91${order.seller.phone}`}>📞</button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, padding: '0.375rem 0.75rem' }}
                    onClick={() => {
                      const msg = lang === 'hi'
                        ? `नमस्ते! मेरा ऑर्डर #${order.id?.slice(-6)} के बारे में जानकारी चाहिए।`
                        : `Hello! I want to enquire about my order #${order.id?.slice(-6)}.`
                      window.open(`https://wa.me/91${order.seller.phone}?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                  >💬</button>
                </div>
              </>
            )}

            {order.buyer && isSeller && (
              <>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                  👤 {lang === 'hi' ? 'खरीदार संपर्क' : 'Buyer Contact'}
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{order.buyer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 +91{order.buyer.phone}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = `tel:+91${order.buyer.phone}`}>📞</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Seller Actions */}
        {isSeller && order.status === 'pending' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleStatusUpdate('accepted')}>
              ✅ {t('accept')}
            </button>
            <button
              className="btn"
              style={{ flex: 1, background: '#fee2e2', color: '#991b1b', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
              onClick={() => handleStatusUpdate('rejected')}
            >
              ❌ {t('reject')}
            </button>
          </div>
        )}

        {isSeller && order.status === 'accepted' && (
          <button className="btn btn-primary btn-block btn-lg" onClick={() => handleStatusUpdate('delivered')}>
            🚚 {t('markDelivered')}
          </button>
        )}
      </div>
    </div>
  )
}
