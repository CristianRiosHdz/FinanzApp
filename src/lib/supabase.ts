import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          currency: string;
          monthly_income_target: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          description: string;
          date: string;
          is_recurring: boolean;
          category: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['incomes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['incomes']['Insert']>;
      };
      expense_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          budget_limit: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expense_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          description: string;
          date: string;
          is_recurring: boolean;
          payment_method: string;
          notes: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['savings_goals']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>;
      };
    };
  };
};
