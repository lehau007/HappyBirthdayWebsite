import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// In-memory token storage — never touches localStorage (BUG-007)
let accessToken: string | null = null
let refreshTokenValue: string | null = null

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

export function setTokens(access: string | null, refresh: string | null): void {
  accessToken = access
  refreshTokenValue = refresh
}

export function getRefreshToken(): string | null {
  return refreshTokenValue
}

// Attach access token to every outgoing request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Auto-refresh on 401 using the in-memory refresh token (BUG-008)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry && refreshTokenValue) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } },
        )
        accessToken = data.access_token
        refreshTokenValue = data.refresh_token  // rotate in-memory refresh token (CRIT-003)
        refreshQueue.forEach((cb) => cb(data.access_token))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        setTokens(null, null)
        refreshQueue = []
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api
