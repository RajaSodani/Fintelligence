import axios from 'axios'

function createInstance(baseURL: string, serviceName: string) {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.request.use(async (config) => {
    try {
      const token = await window.Clerk?.session?.getToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // no-op if Clerk isn't ready
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.location.href = '/sign-in'
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
