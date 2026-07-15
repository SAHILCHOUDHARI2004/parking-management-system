import { useState, useEffect, useCallback } from 'react'
import { api, clearToken, setToken } from '../api/client.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      try {
        // On app startup/reload, try to obtain a new access token using the HTTP-only refresh cookie
        const tokenData = await api('/api/auth/refresh', { method: 'POST' })
        setToken(tokenData.access_token)
        const account = await api('/api/auth/me')
        setUser({ name: account.username, username: account.username, role: account.role, employee: account.employee })
      } catch (err) {
        clearToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken()
      setUser(null)
    }
    window.addEventListener('auth-unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized)
  }, [])


  const login = useCallback(async (username, password) => {
    try {
      const form = new URLSearchParams({ username: username.trim(), password })
      const token = await api('/api/auth/login', { method: 'POST', body: form })
      setToken(token.access_token)
      const account = await api('/api/auth/me')
      setUser({ name: account.username, username: account.username, role: account.role, employee: account.employee })

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Failed to call server logout', err)
    } finally {
      clearToken()
      setUser(null)
    }
  }, [])

  return { user, isLoading, isAuthenticated: !!user, login, logout }
}
