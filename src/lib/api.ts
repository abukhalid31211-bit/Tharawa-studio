/**
 * Tharwah Capital - Secure API Client v2
 * عميل API آمن مع معالجة أخطاء وتوثيق
 */
import { env } from './env';
import { logger } from './logger';
import { sanitizeInput } from './security';

const BASE_URL = env.apiUrl;

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
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
  try {
    // Try Supabase session first
    const { supabase } = await import('./supabase');
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {}

  // Fallback to local token (old system)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || localStorage.getItem('tharwah-auth-token');
  }
  
  return null;
}

export async function request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, skipAuth, ...fetchOptions } = options;
  
  // Build URL with params
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, sanitizeInput(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  // Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Client-Version': '2.0.0',
    ...(options.headers as Record<string, string>),
  };

  // Auth
  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    logger.debug(`API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-JSON responses
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

// Typed API methods
export const api = {
  // Public
  getHomeData: () => request('/home', { skipAuth: true }),
  getMarketsTicker: () => request('/markets/ticker', { skipAuth: true }),
  getContent: (key: string) => request(`/content/${key}`, { skipAuth: true }),
  
  // Services
  getServices: () => request('/services', { skipAuth: true }),
  getService: (id: string) => request(`/services/${id}`, { skipAuth: true, params: { id: sanitizeInput(id) } }),
  
  // Auth (delegated to Supabase)
  login: (email: string, password: string) => 
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true }),
  
  adminLogin: (email: string, password: string) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true }),

  // Protected - Clients
  getClients: (params?: Record<string, string>) => request('/clients', { params }),
  getClient: (id: string) => request(`/clients/${id}`),
  createClient: (data: any) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Protected - Portfolios
  getPortfolios: (params?: Record<string, string>) => request('/portfolios', { params }),
  getPortfolio: (id: string) => request(`/portfolios/${id}`),
  createPortfolio: (data: any) => request('/portfolios', { method: 'POST', body: JSON.stringify(data) }),
  updatePortfolio: (id: string, data: any) => request(`/portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePortfolio: (id: string) => request(`/portfolios/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params?: Record<string, string>) => request('/transactions', { params }),
  createTransaction: (data: any) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Messages
  getMessages: () => request('/messages'),
  createMessage: (data: any) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  
  // Health
  healthCheck: () => request('/health', { skipAuth: true }),
};

export { ApiError };
