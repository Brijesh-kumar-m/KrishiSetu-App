import { supabase } from './supabase'

// =====================================
// Mock Data for Offline/Demo Mode
// =====================================
const MOCK_PRODUCTS = [
  {
    id: 'mock-1',
    crop_name: 'rice',
    crop_emoji: '🌾',
    quantity: 500,
    unit: 'kg',
    price: 28,
    location: 'Gorakhpur, UP',
    description: 'ताजा धान की फसल, अच्छी गुणवत्ता',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 4.5,
    rating_count: 12,
    users: { name: 'रामलाल यादव', phone: '9876543210' }
  },
  {
    id: 'mock-2',
    crop_name: 'wheat',
    crop_emoji: '🌾',
    quantity: 250,
    unit: 'kg',
    price: 22,
    location: 'Lucknow, UP',
    description: 'सोना मोती गेहूं, बेहतरीन क्वालिटी',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 4.2,
    rating_count: 8,
    users: { name: 'सुरेश पटेल', phone: '9876543211' }
  },
  {
    id: 'mock-3',
    crop_name: 'mustard',
    crop_emoji: '🟡',
    quantity: 100,
    unit: 'quintal',
    price: 5200,
    location: 'Agra, UP',
    description: 'पीली सरसों, तेल के लिए बेहतरीन',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 4.8,
    rating_count: 20,
    users: { name: 'मोहन सिंह', phone: '9876543212' }
  },
  {
    id: 'mock-4',
    crop_name: 'potato',
    crop_emoji: '🥔',
    quantity: 300,
    unit: 'kg',
    price: 15,
    location: 'Aligarh, UP',
    description: 'ताजे आलू, सीधे खेत से',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 4.0,
    rating_count: 5,
    users: { name: 'विकास कुमार', phone: '9876543213' }
  },
  {
    id: 'mock-5',
    crop_name: 'onion',
    crop_emoji: '🧅',
    quantity: 200,
    unit: 'kg',
    price: 20,
    location: 'Nashik, MH',
    description: 'लाल प्याज, बढ़िया साइज',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 3.9,
    rating_count: 15,
    users: { name: 'दिलीप फड़के', phone: '9876543214' }
  },
  {
    id: 'mock-6',
    crop_name: 'tomato',
    crop_emoji: '🍅',
    quantity: 150,
    unit: 'kg',
    price: 18,
    location: 'Pune, MH',
    description: 'देसी टमाटर, ताजे और रसीले',
    image_url: null,
    created_at: new Date().toISOString(),
    avg_rating: 4.3,
    rating_count: 9,
    users: { name: 'प्रकाश शर्मा', phone: '9876543215' }
  },
]

const MOCK_ORDERS = [
  {
    id: 'order-1',
    product_id: 'mock-1',
    quantity: 10,
    total_price: 280,
    status: 'delivered',
    delivery_type: 'seller_delivery',
    payment_method: 'cod',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    products: MOCK_PRODUCTS[0],
    seller: { name: 'रामलाल यादव', phone: '9876543210' },
    buyer: { name: 'Demo User', phone: '9999999999' },
  },
  {
    id: 'order-2',
    product_id: 'mock-2',
    quantity: 20,
    total_price: 440,
    status: 'pending',
    delivery_type: 'self_pickup',
    payment_method: 'cod',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    products: MOCK_PRODUCTS[1],
    seller: { name: 'सुरेश पटेल', phone: '9876543211' },
    buyer: { name: 'Demo User', phone: '9999999999' },
  },
]

// =====================================
// Products API
// =====================================
export async function getProducts(filters = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        users(name, phone),
        ratings(rating)
      `)
      .order('created_at', { ascending: false })

    if (filters.crop_name && filters.crop_name !== 'all') {
      query = query.eq('crop_name', filters.crop_name)
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice)
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map(p => ({
      ...p,
      avg_rating: p.ratings?.length
        ? p.ratings.reduce((s, r) => s + r.rating, 0) / p.ratings.length
        : 0,
      rating_count: p.ratings?.length || 0
    }))
  } catch (err) {
    console.warn('Using mock products:', err.message)
    let results = [...MOCK_PRODUCTS]
    if (filters.crop_name && filters.crop_name !== 'all') {
      results = results.filter(p => p.crop_name === filters.crop_name)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(p =>
        p.crop_name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      )
    }
    return results
  }
}

export async function getProductById(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        users(name, phone),
        ratings(rating)
      `)
      .eq('id', productId)
      .single()

    if (error) throw error

    return {
      ...data,
      avg_rating: data.ratings?.length
        ? data.ratings.reduce((s, r) => s + r.rating, 0) / data.ratings.length
        : 0,
      rating_count: data.ratings?.length || 0
    }
  } catch (err) {
    console.warn('Using mock product by ID:', err.message)
    return MOCK_PRODUCTS.find(p => p.id === productId) || null
  }
}

export async function getOrderById(orderId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products(crop_name, price, unit, location, image_url),
        seller:seller_id(name, phone),
        buyer:buyer_id(name, phone)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Using mock order by ID:', err.message)
    return MOCK_ORDERS.find(o => o.id === orderId) || null
  }
}

export async function getUserProducts(userId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Using mock user products:', err.message)
    return MOCK_PRODUCTS.slice(0, 2)
  }
}

export async function createProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Mock create product:', err.message)
    const mockProduct = {
      id: `mock-${Date.now()}`,
      ...productData,
      created_at: new Date().toISOString(),
      avg_rating: 0,
      rating_count: 0,
    }
    MOCK_PRODUCTS.unshift(mockProduct)
    return { data: mockProduct, error: null }
  }
}

export async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.warn('Mock delete product:', err.message)
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === productId)
    if (idx > -1) MOCK_PRODUCTS.splice(idx, 1)
    return { error: null }
  }
}

export async function uploadProductImage(file, userId) {
  try {
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    return { url: data.publicUrl, error: null }
  } catch (err) {
    console.warn('Image upload failed, using placeholder:', err.message)
    return { url: null, error: null }
  }
}

// =====================================
// Orders API
// =====================================
export async function createOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Mock create order:', err.message)
    const mockOrder = {
      id: `order-${Date.now()}`,
      ...orderData,
      created_at: new Date().toISOString(),
      status: 'pending',
    }
    MOCK_ORDERS.unshift(mockOrder)
    return { data: mockOrder, error: null }
  }
}

export async function getBuyerOrders(buyerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products(crop_name, price, unit, location, image_url),
        seller:seller_id(name, phone)
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Using mock buyer orders:', err.message)
    return MOCK_ORDERS
  }
}

export async function getSellerOrders(sellerId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products(crop_name, price, unit, location, image_url),
        buyer:buyer_id(name, phone)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (err) {
    console.warn('Using mock seller orders:', err.message)
    return MOCK_ORDERS
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Mock update order status:', err.message)
    const order = MOCK_ORDERS.find(o => o.id === orderId)
    if (order) order.status = status
    return { data: { ...order, status }, error: null }
  }
}

// =====================================
// Users / Auth API
// =====================================
export async function getUserProfile(phone) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Using mock user profile:', err.message)
    return { data: null, error: null }
  }
}

export async function createUserProfile(userData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Mock create user:', err.message)
    const mockUser = {
      id: `user-${Date.now()}`,
      ...userData,
      created_at: new Date().toISOString(),
    }
    return { data: mockUser, error: null }
  }
}

// =====================================
// Ratings API
// =====================================
export async function submitRating(ratingData) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .insert([ratingData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.warn('Mock submit rating:', err.message)
    return { data: { id: `rating-${Date.now()}`, ...ratingData }, error: null }
  }
}

// =====================================
// OTP Simulation (for demo)
// In production, use Supabase Auth or Twilio
// =====================================
const otpStore = {}

export function sendDemoOtp(phone) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore[phone] = { otp, expiry: Date.now() + 300000 } // 5 minutes expiry
  console.log(`🔐 Demo OTP for ${phone}: ${otp}`) // In production, send via SMS
  return otp // Return for demo UI
}

export function verifyDemoOtp(phone, enteredOtp) {
  const stored = otpStore[phone]
  if (!stored) return false
  if (Date.now() > stored.expiry) return false
  return stored.otp === enteredOtp
}
