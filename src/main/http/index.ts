import { vAxios } from '@simon_he/v-axios'

type Params = Record<string, any>
type RequestConfig = Record<string, any>

export interface HttpClient {
  get: <T = any>(url: string, params?: Params, config?: RequestConfig) => Promise<T>
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>
  delete: <T = any>(url: string, params?: Params, config?: RequestConfig) => Promise<T>
}

const instance = vAxios({
  // cast env to any to avoid missing declaration errors in some TS setups
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
  timeout: 10000
})

const http: HttpClient = {
  async delete<T = any>(url: string, params?: Params, config?: RequestConfig) {
    const res = await instance.delete(url, { params, ...config })
    return (res as any).data as T
  },
  async get<T = any>(url: string, params?: Params, config?: RequestConfig) {
    const res = await instance.get(url, { params, ...config })
    return (res as any).data as T
  },
  async post<T = any>(url: string, data?: any, config?: RequestConfig) {
    const res = await instance.post(url, data, config)
    return (res as any).data as T
  },
  async put<T = any>(url: string, data?: any, config?: RequestConfig) {
    const res = await instance.put(url, data, config)
    return (res as any).data as T
  }
}

export { http }
