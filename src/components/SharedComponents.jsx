import { cropEmojis } from '../lib/translations'

export function StarRating({ rating = 0, size = '1rem', interactive = false, onRate }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= Math.round(rating) ? '' : 'empty'}`}
          onClick={() => interactive && onRate?.(star)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function ProductCard({ product, onAddToCart, onCall, onWhatsApp, onClick, t, lang }) {
  const emoji = cropEmojis[product.crop_name] || '🌱'
  const unitLabel = product.unit === 'kg' ? (lang === 'hi' ? 'किलो' : 'Kg')
                  : product.unit === 'quintal' ? (lang === 'hi' ? 'क्विंटल' : 'Quintal')
                  : 'Ton'

  return (
    <div className="product-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {product.image_url ? (
        <img
          className="product-img"
          src={product.image_url}
          alt={product.crop_name}
          loading="lazy"
        />
      ) : (
        <div className="product-img-placeholder">
          <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
        </div>
      )}
      <div className="product-info">
        <div className="product-name">
          {emoji} {lang === 'hi'
            ? product.crop_name_hi || product.crop_name
            : product.crop_name}
        </div>
        <div className="product-price">
          ₹{product.price.toLocaleString()}<span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 500 }}>/{unitLabel}</span>
        </div>
        <div className="product-location">
          📍 {product.location}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          <StarRating rating={product.avg_rating || 0} size="0.9rem" />
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            ({product.rating_count || 0})
          </span>
        </div>
        <div className="product-actions" onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1, fontSize: '0.8rem' }}
            onClick={() => onAddToCart?.(product)}
          >
            🛒 {t?.('addToCart') || 'Add'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem 0.6rem' }}
            onClick={() => onCall?.(product.users?.phone)}
            title={t?.('callSeller')}
          >
            📞
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.5rem 0.6rem', background: '#dcfce7', color: '#166534' }}
            onClick={() => onWhatsApp?.(product)}
            title={t?.('whatsappSeller')}
          >
            💬
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeleton({ count = 4 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="product-card">
          <div className="skeleton" style={{ height: 160 }}></div>
          <div className="product-info">
            <div className="skeleton" style={{ height: 20, marginBottom: 8 }}></div>
            <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 8 }}></div>
            <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }}></div>
            <div className="skeleton" style={{ height: 36 }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderStatusBadge({ status, t }) {
  const statusMap = {
    pending: { class: 'badge-warning', emoji: '⏳' },
    accepted: { class: 'badge-info', emoji: '✅' },
    delivered: { class: 'badge-success', emoji: '🚚' },
    rejected: { class: 'badge-error', emoji: '❌' },
  }
  const { class: cls, emoji } = statusMap[status] || statusMap.pending

  return (
    <span className={`badge ${cls}`}>
      {emoji} {t?.(status) || status}
    </span>
  )
}

export function LanguageToggle({ lang, onToggle }) {
  return (
    <div className="lang-toggle">
      <button
        className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
        onClick={lang !== 'hi' ? onToggle : undefined}
      >हिं</button>
      <button
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={lang !== 'en' ? onToggle : undefined}
      >EN</button>
    </div>
  )
}
