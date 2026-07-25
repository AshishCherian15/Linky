const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface AuthResponse {
  user: {
    id: string
    email: string
  }
  token: string
}

interface PublicLink {
  id: string
  userId: string
  shortCode: string
  longUrl: string
  customAlias: boolean
  title: string
  expiresAt: string | null
  createdAt: string
  _count?: {
    clicks: number
  }
}

interface AnalyticsData {
  totalClicks: number
  clicksOverTime: Record<string, number>
  referrers: Record<string, number>
  devices: Record<string, number>
}

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('linky_auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('linky_auth_token', token)
    } else {
      localStorage.removeItem('linky_auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  // Auth endpoints
  async signup(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.token)
    return response
  }

  async logout() {
    this.setToken(null)
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  // Link endpoints
  async createLink(data: {
    longUrl: string
    title: string
    customAlias?: string
    expiresAt?: string
  }): Promise<PublicLink> {
    return this.request<PublicLink>('/api/links', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLinks(userId?: string): Promise<PublicLink[]> {
    const query = userId ? `?userId=${userId}` : ''
    return this.request<PublicLink[]>(`/api/links${query}`)
  }

  async getLink(id: string): Promise<PublicLink> {
    return this.request<PublicLink>(`/api/links/${id}`)
  }

  async updateLink(
    id: string,
    data: { customAlias?: string; expiresAt?: string }
  ): Promise<PublicLink> {
    return this.request<PublicLink>(`/api/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteLink(id: string): Promise<void> {
    return this.request(`/api/links/${id}`, {
      method: 'DELETE',
    })
  }

  async getAnalytics(id: string): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(`/api/links/${id}/analytics`)
  }

  async getQRCode(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/links/${id}/qrcode`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    })

    if (!response.ok) {
      throw new Error('Failed to generate QR code')
    }

    return response.blob()
  }
}

export const apiClient = new ApiClient()
