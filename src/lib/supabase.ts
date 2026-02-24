import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'market' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  reputation_score: number;
  created_at: string;
}

export interface Market {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  owner_id: string;
  reputation_score: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags?: string[];
  created_at: string;
}

export interface Price {
  id: string;
  product_id: string;
  market_id: string;
  price: number;
  source_type: 'user' | 'market';
  has_proof: boolean;
  proof_url?: string;
  flash_sale_ends_at?: string; // ISO string
  created_by: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
}

export interface PriceHistoryDaily {
  id: string;
  product_id: string;
  date: string; // YYYY-MM-DD
  avg_price: number;
  min_price: number;
  max_price: number;
}
