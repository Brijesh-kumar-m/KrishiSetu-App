import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { createOrder } from '../lib/db'

const DELIVERY_TYPES = [
  { key: 'self_pickup', hiLabel: 'खुद लेने जाएंगे', enLabel: 'Self Pickup', emoji: '🚶' },
  { key: 'seller_delivery', hiLabel: 'विक्रेता डिलीवरी', enLabel: 'Seller Delivery', emoji: '🚚' },
]

const PAYMENT_METHODS = [
  { key: 'cod', hiLabel: 'कैश ऑन डिलीवरी', enLabel: 'Cash on Delivery', emoji: '💵', available: true },
  { key: 'upi', hiLabel: 'UPI (जल्द आएगा)', enLabel: 'UPI (Coming Soon)', emoji: '📱', available: false },
]

export default function CheckoutPage() {
  const { lang, t } = useLang()
  const { profile } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: '',
    pincode: '',
  })
  const [deliveryType, setDeliveryType] = useState('seller_delivery')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = t('errors.required')
    if (!form.phone || form.phone.length < 10) errs.phone = t('errors.invalidPhone')
    if (deliveryType === 'seller_delivery') {
      if (!form.address.trim()) errs.address = t('errors.required')
      if (!form.pincode || form.pincode.length !== 6) errs.pincode = t('errors.required')
    }
    return errs
  }

  const handlePlaceOrder = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (cartItems.length === 0) {
      toast.error(lang === 'hi' ? 'कार्ट खाली है' : 'Cart is empty')
      navigate('/buy')
      return
    }

    setLoading(true)
    try {
      // Create one order per product to ensure no items are lost
      const orderPromises = cartItems.map(async (item) => {
        const orderData = {
          buyer_id: profile?.id,
          seller_id: item.user_id || 'unknown',
          product_id: item.id,
          quantity: item.cartQty,
          total_price: item.price * item.cartQty,
          status: 'pending',
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          delivery_name: form.name,
          delivery_phone: form.phone,
          delivery_address: form.address,
          delivery_pincode: form.pincode,
        }
        return createOrder(orderData)
      })

      await Promise.all(orderPromises)
      clearCart()
      toast.success(t('success.orderPlaced'))
      navigate('/orders', { replace: true })
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingBottom: '160px' }}>
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/cart')}>←</button>
          <h1 className="page-title">💳 {t('checkoutTitle')}</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Order Summary */}
        <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #bbf7d0' }}>
          <div style={{ fontWeight: 700, color: '#1b4332', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            📦 {lang === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
          </div>
          {cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px', color: '#475569' }}>
              <span>{item.crop_name} × {item.cartQty}</span>
              <span>₹{(item.price * item.cartQty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #bbf7d0', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#166534' }}>
            <span>💰 {t('total')}</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Delivery Type */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            🚚 {t('deliveryType')}
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {DELIVERY_TYPES.map(dt => (
              <button
                key={dt.key}
                id={`delivery-${dt.key}`}
                onClick={() => setDeliveryType(dt.key)}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '12px', border: '2px solid',
                  borderColor: deliveryType === dt.key ? 'var(--primary)' : 'var(--gray-200)',
                  background: deliveryType === dt.key ? '#f0fdf4' : '#fff',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{dt.emoji}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: deliveryType === dt.key ? 'var(--primary)' : 'var(--gray-600)' }}>
                  {lang === 'hi' ? dt.hiLabel : dt.enLabel}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            📍 {t('deliveryAddress')}
          </h2>

          <div className="form-group">
            <label className="form-label">👤 {t('fullName')}</label>
            <input
              id="delivery-name"
              className={`form-control ${errors.name ? 'error' : ''}`}
              placeholder={t('namePlaceholder')}
              value={form.name}
              onChange={e => update('name', e.target.value)}
            />
            {errors.name && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">📞 {t('phoneNumber')}</label>
            <input
              id="delivery-phone"
              className={`form-control ${errors.phone ? 'error' : ''}`}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number"
              value={form.phone}
              onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            {errors.phone && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.phone}</span>}
          </div>

          {deliveryType === 'seller_delivery' && (
            <>
              <div className="form-group">
                <label className="form-label">🏠 {t('address')}</label>
                <textarea
                  id="delivery-address"
                  className={`form-control ${errors.address ? 'error' : ''}`}
                  placeholder={t('addressPlaceholder')}
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  rows={2}
                />
                {errors.address && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.address}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">📮 {t('pincode')}</label>
                <input
                  id="delivery-pincode"
                  className={`form-control ${errors.pincode ? 'error' : ''}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t('pincodePlaceholder')}
                  value={form.pincode}
                  onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {errors.pincode && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.pincode}</span>}
              </div>
            </>
          )}
        </div>

        {/* Payment Method */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
            💳 {t('paymentMethod')}
          </h2>
          {PAYMENT_METHODS.map(pm => (
            <div
              key={pm.key}
              id={`payment-${pm.key}`}
              onClick={() => pm.available && setPaymentMethod(pm.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem', borderRadius: '12px', marginBottom: '0.5rem',
                border: '2px solid',
                borderColor: paymentMethod === pm.key ? 'var(--primary)' : 'var(--gray-200)',
                background: paymentMethod === pm.key ? '#f0fdf4' : pm.available ? '#fff' : '#f8fafc',
                cursor: pm.available ? 'pointer' : 'not-allowed',
                opacity: pm.available ? 1 : 0.6,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{pm.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
                {lang === 'hi' ? pm.hiLabel : pm.enLabel}
              </span>
              {paymentMethod === pm.key && <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>✓</span>}
              {!pm.available && <span className="badge badge-warning">Soon</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Place Order Button */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 'var(--max-width)', padding: '0.75rem 1rem',
        background: '#fff', borderTop: '1px solid var(--gray-100)', zIndex: 150,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {lang === 'hi' ? 'कुल भुगतान' : 'Total Payable'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2d6a4f' }}>
              ₹{cartTotal.toLocaleString()}
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handlePlaceOrder}
            disabled={loading}
            id="place-order-btn"
          >
            {loading ? <span className="spinner spinner-sm"></span> : null}
            ✅ {t('placeOrder')}
          </button>
        </div>
      </div>
    </div>
  )
}
