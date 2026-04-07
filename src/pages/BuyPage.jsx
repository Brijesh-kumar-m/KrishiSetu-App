import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { getProducts } from '../lib/db'
import { cropEmojis, translations } from '../lib/translations'
import { StarRating } from '../components/SharedComponents'

const CROP_FILTERS = ['all', 'rice', 'wheat', 'mustard', 'potato', 'onion', 'tomato', 'corn', 'sugarcane', 'soybean', 'cotton', 'garlic', 'chili', 'lentil', 'chickpea', 'groundnut']

const SORT_OPTIONS = [
  { key: 'newest', hi: 'नई पहले', en: 'Newest' },
  { key: 'price_low', hi: 'कम कीमत', en: 'Price: Low' },
  { key: 'price_high', hi: 'ज्यादा कीमत', en: 'Price: High' },
  { key: 'rating', hi: 'रेटिंग', en: 'Rating' },
]

export default function BuyPage() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const { lang, t } = useLang()
  const { addToCart, cartCount } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const cropParam = searchParams.get('crop')
    if (cropParam) setSelectedCrop(cropParam)
    loadProducts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, search, selectedCrop, sortBy, minPrice, maxPrice])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.crop_name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.users?.name || '').toLowerCase().includes(q)
      )
    }

    if (selectedCrop !== 'all') {
      result = result.filter(p => p.crop_name === selectedCrop)
    }

    if (minPrice) result = result.filter(p => p.price >= Number(minPrice))
    if (maxPrice) result = result.filter(p => p.price <= Number(maxPrice))

    result.sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price
      if (sortBy === 'price_high') return b.price - a.price
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    setFiltered(result)
  }

  const handleAddToCart = (product, e) => {
    e?.stopPropagation()
    addToCart(product, 1)
    toast.success(lang === 'hi' ? '🛒 कार्ट में जोड़ा गया!' : '🛒 Added to cart!')
  }

  const handleCall = (phone, e) => {
    e?.stopPropagation()
    window.location.href = `tel:+91${phone}`
  }

  const handleWhatsApp = (product, e) => {
    e?.stopPropagation()
    const cropName = lang === 'hi' ? translations.hi.crops[product.crop_name] : translations.en.crops[product.crop_name]
    const msg = lang === 'hi'
      ? `नमस्ते! मुझे आपका ${cropName} (₹${product.price}/${product.unit}) खरीदना है। कृपया संपर्क करें।`
      : `Hello! I want to buy your ${cropName} (₹${product.price}/${product.unit}). Please contact me.`
    window.open(`https://wa.me/91${product.users?.phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1 className="page-title">🛒 {t('buyTitle')}</h1>
        </div>

        {/* Search */}
        <div style={{ marginTop: '0.75rem', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>🔍</span>
          <input
            className="form-control search-input"
            placeholder={t('searchCrops')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '40px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            id="search-input"
          />
        </div>
      </div>

      <div className="page-content">
        {/* Crop Filter Chips */}
        <div className="filter-chips" style={{ marginBottom: '0.75rem' }}>
          {CROP_FILTERS.map(crop => {
            const emoji = crop === 'all' ? '🌿' : (cropEmojis[crop] || '🌱')
            const label = crop === 'all'
              ? (lang === 'hi' ? 'सभी' : 'All')
              : (lang === 'hi' ? translations.hi.crops[crop] : translations.en.crops[crop])
            return (
              <button
                key={crop}
                className={`chip ${selectedCrop === crop ? 'active' : ''}`}
                onClick={() => setSelectedCrop(crop)}
              >
                {emoji} {label}
              </button>
            )
          })}
        </div>

        {/* Sort & Filter Row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <select
            className="form-control"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            id="sort-select"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>
                {lang === 'hi' ? opt.hi : opt.en}
              </option>
            ))}
          </select>
          <button
            className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowFilters(prev => !prev)}
            id="filter-btn"
          >
            🔧 {lang === 'hi' ? 'फ़िल्टर' : 'Filter'}
          </button>
        </div>

        {/* Price Filter */}
        {showFilters && (
          <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
              💰 {lang === 'hi' ? 'कीमत सीमा (₹)' : 'Price Range (₹)'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="form-control"
                type="number"
                placeholder={lang === 'hi' ? 'न्यूनतम' : 'Min'}
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                style={{ flex: 1 }}
              />
              <span style={{ color: 'var(--gray-400)' }}>—</span>
              <input
                className="form-control"
                type="number"
                placeholder={lang === 'hi' ? 'अधिकतम' : 'Max'}
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setMinPrice(''); setMaxPrice('') }}
              >✕</button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.75rem', fontWeight: 500 }}>
          {loading ? '...' : `${filtered.length} ${lang === 'hi' ? 'उत्पाद मिले' : 'products found'}`}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="products-grid">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                <div className="skeleton" style={{ height: 150 }}></div>
                <div style={{ padding: '0.75rem' }}>
                  <div className="skeleton" style={{ height: 16, marginBottom: 6 }}></div>
                  <div className="skeleton" style={{ height: 22, width: '65%', marginBottom: 6 }}></div>
                  <div className="skeleton" style={{ height: 36, marginTop: 8 }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌾</div>
            <h3>{lang === 'hi' ? 'कोई फसल नहीं मिली' : 'No crops found'}</h3>
            <p>{lang === 'hi' ? 'अलग खोज या फ़िल्टर आज़माएं' : 'Try different search or filters'}</p>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(product => {
              const emoji = cropEmojis[product.crop_name] || '🌱'
              const cropName = lang === 'hi'
                ? translations.hi.crops[product.crop_name] || product.crop_name
                : translations.en.crops[product.crop_name] || product.crop_name
              const unitLabel = product.unit === 'kg' ? 'Kg' : product.unit === 'quintal' ? 'Q' : 'T'

              return (
                <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`, { state: { product } })}>
                  {product.image_url ? (
                    <img className="product-img" src={product.image_url} alt={cropName} loading="lazy" style={{ height: 150 }} />
                  ) : (
                    <div className="product-img-placeholder" style={{ height: 150 }}>
                      <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
                    </div>
                  )}
                  <div className="product-info" style={{ padding: '0.6rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: 2 }}>
                      {emoji} {cropName}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d6a4f', marginBottom: 2 }}>
                      ₹{product.price}<span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>/{unitLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 3 }}>
                      📍 {product.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.5rem' }}>
                      <StarRating rating={product.avg_rating || 0} size="0.8rem" />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({product.rating_count || 0})</span>
                    </div>
                    {product.users?.name && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 600 }}>
                        👨‍🌾 {product.users.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '10px 6px', minHeight: '44px' }}
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        🛒
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '10px 10px', fontSize: '0.9rem', minHeight: '44px', minWidth: '44px' }}
                        onClick={(e) => handleCall(product.users?.phone, e)}
                        aria-label="Call seller"
                      >📞</button>
                      <button
                        className="btn btn-sm"
                        style={{ padding: '10px 10px', fontSize: '0.9rem', background: '#dcfce7', color: '#166534', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', minHeight: '44px', minWidth: '44px' }}
                        onClick={(e) => handleWhatsApp(product, e)}
                        aria-label="WhatsApp seller"
                      >💬</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart FAB */}
      <button
        className="cart-float"
        onClick={() => navigate('/cart')}
        id="cart-fab"
      >
        🛒
        {cartCount > 0 && (
          <span className="nav-badge">{cartCount}</span>
        )}
      </button>
    </div>
  )
}
