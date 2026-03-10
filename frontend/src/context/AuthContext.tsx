import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import api, { setTokens, getRefreshToken } from '../api/axios'

interface AuthUser {
  id: number
  username: string
  role: 'root_admin' | 'admin' | 'normal_user'
}

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Tokens live only in memory (never localStorage) — BUG-007
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password })
    setTokens(data.access_token, data.refresh_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      await api.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {})
    } finally {
      setTokens(null, null)
      setUser(null)
    }
  }, [])

  // Let the axios interceptor signal a forced logout (refresh failed)
  useEffect(() => {
    const handler = () => { setTokens(null, null); setUser(null) }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
