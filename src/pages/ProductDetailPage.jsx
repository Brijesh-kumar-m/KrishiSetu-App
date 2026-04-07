import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { StarRating } from '../components/SharedComponents'
import { cropEmojis, translations } from '../lib/translations'
import { submitRating, getProductById } from '../lib/db'

export default function ProductDetailPage() {
  const [qty, setQty] = useState(1)
  const [showRating, setShowRating] = useState(false)
  const [myRating, setMyRating] = useState(0)
  const [review, setReview] = useState('')
  const [ratingLoading, setRatingLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const { lang, t } = useLang()
  const { addToCart } = useCart()
  const toast = useToast()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  useEffect(() => {
    // Try location.state first, then fetch by ID
    if (location.state?.product) {
      setProduct(location.state.product)
      setLoading(false)
    } else {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const data = await getProductById(id)
      setProduct(data)
    } catch {
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate(-1)}>←</button>
            <h1 className="page-title">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</h1>
          </div>
        </div>
        <div className="loading-overlay"><div className="spinner"></div></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-content">
            <button className="back-btn" onClick={() => navigate('/buy')}>←</button>
            <h1 className="page-title">{lang === 'hi' ? 'उत्पाद विवरण' : 'Product Details'}</h1>
          </div>
        </div>
        <div className="empty-state" style={{ paddingTop: '4rem' }}>
          <div className="empty-state-icon">😕</div>
          <h3>{lang === 'hi' ? 'उत्पाद नहीं मिला' : 'Product not found'}</h3>
          <button className="btn btn-primary" onClick={() => navigate('/buy')}>
            {lang === 'hi' ? 'वापस जाएं' : 'Go back'}
          </button>
        </div>
      </div>
    )
  }

  const emoji = cropEmojis[product.crop_name] || '🌱'
  const cropName = lang === 'hi'
    ? translations.hi.crops[product.crop_name] || product.crop_name
    : translations.en.crops[product.crop_name] || product.crop_name
  const unitLabel = product.unit === 'kg'
    ? (lang === 'hi' ? 'किलोग्राम' : 'Kilogram')
    : product.unit === 'quintal'
    ? (lang === 'hi' ? 'क्विंटल' : 'Quintal')
    : (lang === 'hi' ? 'टन' : 'Ton')

  const handleAddToCart = () => {
    addToCart(product, qty)
    toast.success(lang === 'hi' ? `${qty} ${unitLabel} कार्ट में जोड़ा!` : `${qty} ${unitLabel} added to cart!`)
  }

  const handleCall = () => {
    window.location.href = `tel:+91${product.users?.phone}`
  }

  const handleWhatsApp = () => {
    const msg = lang === 'hi'
      ? `नमस्ते! मुझे आपका ${cropName} (₹${product.price}/${product.unit}) खरीदना है। ${qty} ${unitLabel} के लिए कृपया संपर्क करें।`
      : `Hello! I want to buy ${qty} ${unitLabel} of your ${cropName} at ₹${product.price}/${product.unit}. Please contact me.`
    window.open(`https://wa.me/91${product.users?.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleRatingSubmit = async () => {
    if (!myRating) {
      toast.error(lang === 'hi' ? 'रेटिंग चुनें' : 'Select a rating')
      return
    }
    setRatingLoading(true)
    try {
      await submitRating({
        product_id: product.id,
        seller_id: product.user_id,
        buyer_id: profile?.id,
        rating: myRating,
        review,
      })
      toast.success(t('success.ratingSubmitted'))
      setShowRating(false)
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setRatingLoading(false)
    }
  }

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1 className="page-title">{cropName}</h1>
        </div>
      </div>

      {/* Product Image */}
      {product.image_url ? (
        <img src={product.image_url} alt={cropName} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: '100%', height: '220px',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '6rem',
        }}>
          {emoji}
        </div>
      )}

      <div style={{ padding: '1rem' }}>
        {/* Title & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b4332', marginBottom: '4px' }}>
              {emoji} {cropName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StarRating rating={product.avg_rating || 0} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({product.rating_count || 0} {lang === 'hi' ? 'रेटिंग' : 'ratings'})</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2d6a4f', lineHeight: 1 }}>
              ₹{product.price.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {lang === 'hi' ? 'प्रति' : 'per'} {unitLabel}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '0.75rem', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
              📦 {lang === 'hi' ? 'उपलब्ध मात्रा' : 'Available'}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
              {product.quantity} {product.unit}
            </div>
          </div>
          <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '0.75rem', border: '1px solid #fed7aa' }}>
            <div style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600 }}>
              📍 {lang === 'hi' ? 'स्थान' : 'Location'}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9a3412' }}>
              {product.location}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        {product.users && (
          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar avatar-green">{product.users.name?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{product.users.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                👨‍🌾 {lang === 'hi' ? 'किसान' : 'Farmer'} • 📍 {product.location}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
              📝 {lang === 'hi' ? 'विवरण' : 'Description'}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {product.description}
            </p>
          </div>
        )}

        {/* Quantity Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>
            {lang === 'hi' ? 'मात्रा चुनें' : 'Select Quantity'} ({unitLabel})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-ghost"
              style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, fontSize: '1.25rem' }}
              onClick={() => setQty(q => Math.max(1, q - 1))}
            >−</button>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d6a4f', minWidth: '48px', textAlign: 'center' }}>
              {qty}
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, fontSize: '1.25rem' }}
              onClick={() => setQty(q => Math.min(product.quantity, q + 1))}
            >+</button>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              = ₹{(product.price * qty).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Rating Section */}
        {!showRating ? (
          <button
            className="btn btn-ghost btn-block"
            style={{ marginBottom: '1rem', border: '2px dashed var(--gray-300)' }}
            onClick={() => setShowRating(true)}
          >
            ⭐ {lang === 'hi' ? 'इस विक्रेता को रेट करें' : 'Rate this seller'}
          </button>
        ) : (
          <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#92400e' }}>
              ⭐ {lang === 'hi' ? 'रेटिंग दें' : 'Give Rating'}
            </h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem', justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setMyRating(star)}
                  style={{
                    fontSize: '2rem', border: 'none', background: 'none', cursor: 'pointer',
                    color: star <= myRating ? '#f59e0b' : '#d1d5db',
                    transition: 'color 0.15s, transform 0.15s',
                    transform: star <= myRating ? 'scale(1.1)' : 'scale(1)',
                  }}
                >★</button>
              ))}
            </div>
            <textarea
              className="form-control"
              placeholder={lang === 'hi' ? 'समीक्षा लिखें (वैकल्पिक)' : 'Write a review (optional)'}
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={2}
              style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRating(false)}
              >✕</button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={handleRatingSubmit}
                disabled={ratingLoading}
              >
                {ratingLoading ? <span className="spinner spinner-sm"></span> : null}
                {lang === 'hi' ? 'रेटिंग दें' : 'Submit Rating'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 'var(--max-width)', padding: '0.75rem 1rem',
        background: '#fff', borderTop: '1px solid var(--gray-100)',
        display: 'flex', gap: '0.5rem', zIndex: 150,
      }}>
        <button className="btn btn-ghost" style={{ flex: 0, padding: '0.75rem 1rem' }} onClick={handleCall}>📞</button>
        <button
          className="btn btn-sm"
          style={{ flex: 0, padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          onClick={handleWhatsApp}
        >💬</button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddToCart} id="add-to-cart-btn">
          🛒 {t('addToCart')}
        </button>
        <button
          className="btn btn-accent"
          style={{ flex: 1 }}
          onClick={() => { handleAddToCart(); navigate('/cart') }}
          id="buy-now-btn"
        >
          ⚡ {lang === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
        </button>
      </div>
    </div>
  )
}
