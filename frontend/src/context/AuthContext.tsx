import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { SafeUser } from '../types'

type AuthState = {
  token: string | null
  user: SafeUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
    nationalId?: string
    dateOfBirth?: string
  }) => Promise<void>
  activate: (email: string, code: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stb_token'))
  const [user, setUser] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<{ user: SafeUser }>('/auth/me')
      setUser(data.user)
    } catch {
      localStorage.removeItem('stb_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refreshMe()
  }, [refreshMe])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: SafeUser }>('/auth/login', {
      email,
      password,
    })
    localStorage.setItem('stb_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (payload: {
      email: string
      firstName?: string
      lastName?: string
      phone?: string
      nationalId?: string
      dateOfBirth?: string
    }) => {
      await api.post('/auth/register', payload)
    },
    [],
  )

  const activate = useCallback(async (email: string, code: string, password: string) => {
    const { data } = await api.post<{ token: string; user: SafeUser }>('/auth/activate', {
      email,
      code,
      password,
    })
    localStorage.setItem('stb_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('stb_token')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      activate,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, register, activate, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
