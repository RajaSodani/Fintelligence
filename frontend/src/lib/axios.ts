import axios from 'axios'

const TOKEN_KEY = 'fintelligence_token'

// ── Clerk version (preserved for future switch-back) ──────────────────────
// const token = await window.Clerk?.session?.getToken()
// ──────────────────────────────────────────────────────────────────────────

function createInstance(baseURL: string, serviceName: string) {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        window.location.href = '/auth/sign-in'
      }
      if (error.response?.status >= 500) {
        console.error(`[${serviceName}] Server error:`, error.response?.data ?? error.message)
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export const coreApi = createInstance(
  import.meta.env.VITE_CORE_API ?? 'http://localhost:3001',
  'core-api',
)

export const aiApi = createInstance(
  import.meta.env.VITE_AI_API ?? 'http://localhost:3002',
  'ai-api',
)

export default coreApi
