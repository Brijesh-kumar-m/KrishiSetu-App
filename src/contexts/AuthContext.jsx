import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
  }, [])

  useEffect(() => {
    // Check for stored session (demo mode uses localStorage)
    const storedUser = localStorage.getItem('ks_user')
    const storedProfile = localStorage.getItem('ks_profile')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      if (storedProfile) setProfile(JSON.parse(storedProfile))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (userData, profileData) => {
    setUser(userData)
    setProfile(profileData)
    localStorage.setItem('ks_user', JSON.stringify(userData))
    localStorage.setItem('ks_profile', JSON.stringify(profileData))
  }, [])

  const updateProfile = useCallback((profileData) => {
    setProfile(profileData)
    localStorage.setItem('ks_profile', JSON.stringify(profileData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setProfile(null)
    localStorage.removeItem('ks_user')
    localStorage.removeItem('ks_profile')
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, updateProfile, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
