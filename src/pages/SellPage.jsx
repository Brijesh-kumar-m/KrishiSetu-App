import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { createProduct, uploadProductImage } from '../lib/db'
import { translations } from '../lib/translations'

const CROPS = Object.keys(translations.hi.crops)
const UNITS = ['kg', 'quintal', 'ton']

export default function SellPage() {
  const [form, setForm] = useState({
    crop_name: '',
    quantity: '',
    unit: 'kg',
    price: '',
    location: '',
    description: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const fileRef = useRef(null)
  const { lang, t } = useLang()
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.crop_name) errs.crop_name = t('errors.required')
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) errs.quantity = t('errors.required')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = t('errors.required')
    if (!form.location.trim()) errs.location = t('errors.required')
    return errs
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'hi' ? 'फोटो का आकार 5MB से कम होना चाहिए' : 'Image must be less than 5MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error(t('errors.required'))
      return
    }

    setLoading(true)
    try {
      let imageUrl = null
      if (imageFile) {
        const { url } = await uploadProductImage(imageFile, profile?.id)
        imageUrl = url
      }

      const productData = {
        user_id: profile?.id,
        crop_name: form.crop_name,
        quantity: Number(form.quantity),
        unit: form.unit,
        price: Number(form.price),
        location: form.location.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
      }

      const { error } = await createProduct(productData)
      if (error) throw error

      toast.success(t('success.listingCreated'))
      navigate('/dashboard')
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lang === 'hi' ? 'स्थान सेवा उपलब्ध नहीं' : 'Location not available')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        update('location', `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`)
        toast.info(lang === 'hi' ? '📍 स्थान प्राप्त हुआ' : '📍 Location captured')
      },
      () => toast.error(lang === 'hi' ? 'स्थान प्राप्त नहीं हो सका' : 'Could not get location')
    )
  }

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      <div className="page-header">
        <div className="page-header-content">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1 className="page-title">🌾 {t('sellTitle')}</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Image Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', height: '180px', borderRadius: '16px',
            border: '2px dashed var(--gray-300)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.25rem', overflow: 'hidden', background: '#f8fafc',
            position: 'relative', transition: 'border-color 0.2s',
          }}
          id="image-upload-area"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
                {lang === 'hi' ? '✏️ बदलें' : '✏️ Change'}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('uploadImage')}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                {lang === 'hi' ? 'JPG, PNG (5MB तक)' : 'JPG, PNG (up to 5MB)'}
              </div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

        {/* Crop Name */}
        <div className="form-group">
          <label className="form-label">🌾 {t('cropName')} *</label>
          <select
            className={`form-control ${errors.crop_name ? 'error' : ''}`}
            value={form.crop_name}
            onChange={e => update('crop_name', e.target.value)}
            id="crop-select"
          >
            <option value="">{t('selectCrop')}</option>
            {CROPS.map(crop => (
              <option key={crop} value={crop}>
                {lang === 'hi' ? translations.hi.crops[crop] : translations.en.crops[crop]}
              </option>
            ))}
          </select>
          {errors.crop_name && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.crop_name}</span>}
        </div>

        {/* Quantity & Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">⚖️ {t('quantity')} *</label>
            <input
              className={`form-control ${errors.quantity ? 'error' : ''}`}
              type="number"
              inputMode="numeric"
              placeholder={t('quantityPlaceholder')}
              value={form.quantity}
              onChange={e => update('quantity', e.target.value)}
              id="quantity-input"
            />
            {errors.quantity && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.quantity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{t('unit')}</label>
            <select
              className="form-control"
              value={form.unit}
              onChange={e => update('unit', e.target.value)}
              id="unit-select"
            >
              {UNITS.map(u => (
                <option key={u} value={u}>
                  {lang === 'hi' ? translations.hi.units[u] : translations.en.units[u]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label">💰 {t('pricePerUnit')} *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700, fontSize: '1rem' }}>₹</span>
            <input
              className={`form-control ${errors.price ? 'error' : ''}`}
              type="number"
              inputMode="numeric"
              placeholder={t('pricePlaceholder')}
              value={form.price}
              onChange={e => update('price', e.target.value)}
              style={{ paddingLeft: '36px' }}
              id="price-input"
            />
          </div>
          {errors.price && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.price}</span>}
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">📍 {t('location')} *</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className={`form-control ${errors.location ? 'error' : ''}`}
              type="text"
              placeholder={t('locationPlaceholder')}
              value={form.location}
              onChange={e => update('location', e.target.value)}
              style={{ flex: 1 }}
              id="location-input"
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleAutoLocation}
              title={lang === 'hi' ? 'GPS से लोकेशन' : 'Use GPS'}
              aria-label={lang === 'hi' ? 'GPS से लोकेशन' : 'Use GPS'}
              style={{ flexShrink: 0, minHeight: '44px', minWidth: '44px', fontSize: '1.1rem' }}
            >
              🎯
            </button>
          </div>
          {errors.location && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errors.location}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">📝 {t('description')}</label>
          <textarea
            className="form-control"
            placeholder={t('descPlaceholder')}
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            id="description-input"
          />
        </div>

        {/* Preview */}
        {form.crop_name && form.price && (
          <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1rem', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#166534', marginBottom: '0.5rem' }}>
              👁 {lang === 'hi' ? 'झलक' : 'Preview'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1b4332' }}>
                  {lang === 'hi' ? translations.hi.crops[form.crop_name] : translations.en.crops[form.crop_name]}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  📦 {form.quantity} {form.unit} • 📍 {form.location || '—'}
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d6a4f' }}>
                ₹{form.price}
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>/{form.unit}</span>
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={handleSubmit}
          disabled={loading}
          id="post-listing-btn"
        >
          {loading ? <><span className="spinner spinner-sm"></span> {lang === 'hi' ? 'पोस्ट हो रहा है...' : 'Posting...'}</> : `🌾 ${t('postListing')}`}
        </button>
      </div>
    </div>
  )
}
