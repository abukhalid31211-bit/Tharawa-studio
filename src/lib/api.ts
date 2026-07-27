/**
 * Tharwah Capital - Secure API Client v3
 * Backend-only integration
 */
import { env } from './env';
import { logger } from './logger';
import { sanitizeInput } from './security';
import { getJwtToken, setAuthTokens, clearAllSessions } from './auth';

const BASE_URL = env.apiUrl;

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  authRetried?: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return getJwtToken();
}

export async function request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, skipAuth, authRetried, ...fetchOptions } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, sanitizeInput(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Version': '2.0.0',
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    logger.debug(`API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      credentials: 'include', // send HttpOnly refresh-token cookie automatically
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      if (!skipAuth && !authRetried && data?.code === 'TOKEN_EXPIRED') {
        // Cookie is sent automatically via credentials:'include' — no token in body
        try {
          const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (refreshResponse.ok) {
            const refreshed = await refreshResponse.json();
            setAuthTokens(refreshed.token); // only access token returned in body
            return request<T>(endpoint, { ...options, authRetried: true });
          }
        } catch { /* fall through */ }
        clearAllSessions();
      }
      const message = data?.message || data?.error || `API error: ${response.statusText}`;
      throw new ApiError(message, response.status, data?.code, data);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الطلب', 408, 'TIMEOUT');
    }

    logger.error(`API Request failed: ${url}`, error);
    throw new ApiError(
      error instanceof Error ? error.message : 'حدث خطأ في الاتصال',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Public
  getHomeData: () => request('/api/home', { skipAuth: true }),
  getMarketsTicker: () => request('/api/markets/ticker', { skipAuth: true }),
  getContent: (key: string) => request(`/api/content/${key}`, { skipAuth: true }),
  getAllContent: () => request('/api/content', { skipAuth: false }),
  updateContent: (key: string, data: any) => request(`/api/content/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSettings: () => request('/api/settings', { skipAuth: true }),
  getPlatformData: (key: string) => request(`/api/platform-data/${encodeURIComponent(key)}`),
  updatePlatformData: (key: string, value: unknown) => request(`/api/platform-data/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  // Auth
  // identifier: email address OR portfolio_code (account number) sent as-is — no @tharwah.local wrapping
  login: (identifier: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }), skipAuth: true }),
  adminLogin: (email: string, password: string) =>
    request('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true }),
  // Cookie is sent automatically — no token in body
  refreshToken: () =>
    request('/api/auth/refresh', { method: 'POST', skipAuth: true }),
  // Backend reads token from cookie, revokes it, and clears the cookie
  logout: () => request('/api/auth/logout', { method: 'POST', skipAuth: true }),
  changePassword: (currentPassword: string, newPassword: string) => request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getProfile: () => request('/api/auth/profile'),
  updateProfile: (data: { phone?: string; profile_data?: Record<string, unknown> }) => request('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Protected - Clients
  getClients: (params?: Record<string, string>) => request('/api/clients', { params }),
  getClient: (id: string) => request(`/api/clients/${id}`),
  createClient: (data: any) => request('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/api/clients/${id}`, { method: 'DELETE' }),

  // Protected - Portfolios
  getPortfolios: (params?: Record<string, string>) => request('/api/portfolios', { params }),
  getPortfolio: (id: string) => request(`/api/portfolios/${id}`),
  createPortfolio: (data: any) => request('/api/portfolios', { method: 'POST', body: JSON.stringify(data) }),
  updatePortfolio: (id: string, data: any) => request(`/api/portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePortfolio: (id: string) => request(`/api/portfolios/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: Record<string, string>) => request('/api/transactions', { params }),
  createTransaction: (data: any) => request('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Messages
  getMessages: () => request('/api/messages'),
  createMessage: (data: any) => request('/api/messages', { method: 'POST', body: JSON.stringify(data) }),
  updateMessage: (id: string, data: any) => request(`/api/messages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/api/notifications'),
  createNotification: (data: any) => request('/api/notifications', { method: 'POST', body: JSON.stringify(data) }),
  markNotificationRead: (id: string) => request(`/api/notifications/${id}/read`, { method: 'POST' }),

  // Meetings
  getMeetings: () => request('/api/meetings'),
  createMeeting: (data: any) => request('/api/meetings', { method: 'POST', body: JSON.stringify(data) }),
  updateMeeting: (id: string, data: any) => request(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeeting: (id: string) => request(`/api/meetings/${id}`, { method: 'DELETE' }),

  // Sub-admins
  getSubAdmins: () => request('/api/sub-admins'),
  createSubAdmin: (data: any) => request('/api/sub-admins', { method: 'POST', body: JSON.stringify(data) }),
  updateSubAdmin: (id: string, data: any) => request(`/api/sub-admins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubAdmin: (id: string) => request(`/api/sub-admins/${id}`, { method: 'DELETE' }),

  // Settings
  updateSettings: (key: string, data: any) => request(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => request('/api/audit', { params }),
  getLoginAttempts: (params?: Record<string, string>) => request('/api/audit/login-attempts', { params }),

  // Public Contact Form (no auth)
  submitContact: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    request('/api/contact', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),

  // Stats
  getPublicStats: () => request('/api/stats/public', { skipAuth: true }),
  // Admin Stats — real aggregated metrics for the Overview dashboard
  getAdminStats: () => request('/api/stats/overview'),

  // ─── Reports (server-side aggregation) ───
  getReportsSummary: (period?: string) => request('/api/reports/summary', { params: period ? { period } : undefined }),
  getReportsClients: (page?: number, limit?: number) => request('/api/reports/clients', { params: { ...(page ? { page: String(page) } : {}), ...(limit ? { limit: String(limit) } : {}) } }),
  getReportsTransactions: (period?: string, page?: number) => request('/api/reports/transactions', { params: { ...(period ? { period } : {}), ...(page ? { page: String(page) } : {}) } }),

  // Search
  globalSearch: (q: string) => request('/api/search', { params: { q } }),

  // Health
  healthCheck: () => request('/health', { skipAuth: true }),
};

export { ApiError };
