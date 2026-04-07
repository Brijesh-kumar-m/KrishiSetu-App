import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { cropEmojis, translations } from '../lib/translations'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQty, cartTotal, cartCount, clearCart } = useCart()
  const { lang, t } = useLang()
  const navigate = useNavigate()

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate('/buy')}>←</button>
            <h1 className="page-title">🛒 {t('cartTitle')}</h1>
          </div>
        </div>
        <div className="empty-state" style={{ paddingTop: '5rem' }}>
          <div style={{ fontSize: '5rem' }}>🛒</div>
          <h3>{t('cartEmpty')}</h3>
          <p>{t('cartEmptyDesc')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/buy')}>
            🌾 {lang === 'hi' ? 'फसल खरीदें' : 'Browse Crops'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ paddingBottom: '160px' }}>
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/buy')}>←</button>
          <h1 className="page-title">🛒 {t('cartTitle')} ({cartCount})</h1>
          <button
            onClick={() => {
              if (window.confirm(lang === 'hi' ? 'सभी आइटम हटाएं?' : 'Remove all items from cart?')) {
                clearCart()
              }
            }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
          >
            {lang === 'hi' ? 'खाली करें' : 'Clear'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {cartItems.map(item => {
          const emoji = cropEmojis[item.crop_name] || '🌱'
          const cropName = lang === 'hi'
            ? translations.hi.crops[item.crop_name] || item.crop_name
            : translations.en.crops[item.crop_name] || item.crop_name

          return (
            <div key={item.id} style={{
              background: '#fff', borderRadius: '16px', padding: '1rem',
              marginBottom: '0.75rem', boxShadow: 'var(--shadow-md)',
              display: 'flex', gap: '0.75rem', alignItems: 'center',
            }}>
              {/* Image/Emoji */}
              <div style={{ width: 64, height: 64, borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={cropName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                ) : emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {emoji} {cropName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  ₹{item.price}/{item.unit} • {item.users?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--gray-200)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => updateQty(item.id, item.cartQty - 1)}
                  >−</button>
                  <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>{item.cartQty}</span>
                  <button
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--gray-200)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => updateQty(item.id, item.cartQty + 1)}
                  >+</button>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d6a4f' }}>
                  ₹{(item.price * item.cartQty).toLocaleString()}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ background: '#fee2e2', border: 'none', color: '#991b1b', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {t('remove')}
                </button>
              </div>
            </div>
          )
        })}

        {/* Price Breakdown */}
        <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1rem', border: '1px solid #bbf7d0', marginTop: '0.5rem' }}>
          <h3 style={{ fontWeight: 700, color: '#1b4332', marginBottom: '0.75rem', fontSize: '1rem' }}>
            💰 {lang === 'hi' ? 'मूल्य विवरण' : 'Price Summary'}
          </h3>
          {cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px', color: '#475569' }}>
              <span>
                {lang === 'hi'
                  ? translations.hi.crops[item.crop_name] || item.crop_name
                  : translations.en.crops[item.crop_name] || item.crop_name}
                {' '}× {item.cartQty}
              </span>
              <span>₹{(item.price * item.cartQty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: '#bbf7d0', margin: '0.75rem 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#1b4332' }}>
            <span>💰 {t('total')}</span>
            <span>₹{cartTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Checkout Banner */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 'var(--max-width)', padding: '0.75rem 1rem',
        background: '#fff', borderTop: '1px solid var(--gray-100)', zIndex: 150,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cartCount} {t('items')}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2d6a4f' }}>₹{cartTotal.toLocaleString()}</div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/checkout')}
            id="checkout-btn"
          >
            {t('checkout')} →
          </button>
        </div>
      </div>
    </div>
  )
}
