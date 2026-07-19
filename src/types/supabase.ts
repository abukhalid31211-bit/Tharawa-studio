/**
 * Supabase Types - Generated + Manual
 * Types for database tables
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'client' | 'admin' | 'super';
          tier: string;
          status: 'pending' | 'active' | 'suspended';
          portfolio_code: string | null;
          phone: string | null;
          kyc_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'client' | 'admin' | 'super';
          tier?: string;
          status?: 'pending' | 'active' | 'suspended';
          portfolio_code?: string | null;
          phone?: string | null;
          kyc_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: 'client' | 'admin' | 'super';
          tier?: string;
          status?: 'pending' | 'active' | 'suspended';
          portfolio_code?: string | null;
          phone?: string | null;
          kyc_status?: string;
          updated_at?: string;
        };
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          name_en: string | null;
          total_valuation: number;
          risk_profile: string;
          currency: string;
          growth_percent: number;
          inception_date: string;
          is_active: boolean;
          portfolio_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          name_en?: string | null;
          total_valuation?: number;
          risk_profile?: string;
          currency?: string;
          growth_percent?: number;
          inception_date?: string;
          is_active?: boolean;
          portfolio_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          name_en?: string | null;
          total_valuation?: number;
          risk_profile?: string;
          currency?: string;
          growth_percent?: number;
          is_active?: boolean;
          portfolio_data?: Json;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          portfolio_id: string | null;
          type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'transfer';
          amount: number;
          currency: string;
          method: string | null;
          status: 'pending' | 'completed' | 'rejected';
          reference_code: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          portfolio_id?: string | null;
          type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'transfer';
          amount: number;
          currency?: string;
          method?: string | null;
          status?: 'pending' | 'completed' | 'rejected';
          reference_code?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'completed' | 'rejected';
          notes?: string | null;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_portfolio_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      clean_old_login_attempts: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: 'client' | 'admin' | 'super';
      user_status: 'pending' | 'active' | 'suspended';
      transaction_type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'transfer';
      transaction_status: 'pending' | 'completed' | 'rejected';
    };
  };
}
