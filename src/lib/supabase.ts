/**
 * Tharwah Capital - Supabase Client
 * عميل Supabase مع fallback آمن للـ mock mode
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, logEnvStatus } from './env';

let supabaseInstance: SupabaseClient | null = null;
let initializationWarningShown = false;

function createMockClient(): SupabaseClient {
  if (!initializationWarningShown && typeof window !== 'undefined') {
    initializationWarningShown = true;
    console.warn(
      '[Supabase] Using MOCK client - No real backend connection. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable production mode.'
    );
  }

  // إرجاع كائن mock يحاكي واجهة Supabase لكنه يعيد بيانات فارغة
  const mockBuilder = {
    select: () => mockBuilder,
    insert: () => mockBuilder,
    update: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    neq: () => mockBuilder,
    gt: () => mockBuilder,
    lt: () => mockBuilder,
    gte: () => mockBuilder,
    lte: () => mockBuilder,
    like: () => mockBuilder,
    ilike: () => mockBuilder,
    in: () => mockBuilder,
    order: () => mockBuilder,
    limit: () => mockBuilder,
    range: () => mockBuilder,
    single: async () => ({ data: null, error: { message: 'Mock mode - Supabase not configured' } }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
    // For auth
    data: [],
    error: null,
  };

  const mockAuth = {
    signUp: async () => ({ data: null, error: { message: 'Mock mode' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Mock mode' } }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };

  return {
    from: () => mockBuilder as any,
    auth: mockAuth as any,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Mock mode' } }),
        download: async () => ({ data: null, error: { message: 'Mock mode' } }),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    } as any,
    channel: () => ({
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
  } as unknown as SupabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (env.isMockMode || !env.supabaseUrl || !env.supabaseAnonKey) {
    supabaseInstance = createMockClient();
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'tharwah-auth-token',
      },
      global: {
        headers: {
          'X-Client-Info': 'tharwah-capital-web',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    if (typeof window !== 'undefined') {
      logEnvStatus();
    }

    return supabaseInstance;
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    supabaseInstance = createMockClient();
    return supabaseInstance;
  }
}

// تصدير العميل الافتراضي
export const supabase = getSupabaseClient();

// Helpers
export function isSupabaseConfigured(): boolean {
  return !env.isMockMode && !!env.supabaseUrl && !!env.supabaseAnonKey;
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  if (env.isMockMode) {
    return { connected: false, error: 'Supabase not configured - running in mock mode' };
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from('users').select('id').limit(1).maybeSingle();
    
    if (error && error.message.includes('Mock mode')) {
      return { connected: false, error: error.message };
    }

    // حتى لو كان الخطأ "relation does not exist" فالاتصال موجود
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

// Types for database
export type DbUser = {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin' | 'super';
  tier: string;
  status: 'pending' | 'active' | 'suspended';
  portfolio_code: string | null;
  created_at: string;
  updated_at: string;
};

export type DbPortfolio = {
  id: string;
  user_id: string;
  name: string;
  total_valuation: number;
  risk_profile: string;
  created_at: string;
  updated_at: string;
};

export type DbTransaction = {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'transfer';
  amount: number;
  currency: string;
  method: string | null;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
};
