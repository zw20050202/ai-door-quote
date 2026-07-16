// Type declarations for better-sqlite3 database
export interface User {
  id: number;
  phone: string;
  company_name: string;
  contact_name?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address?: string;
  remark?: string;
  total_quotes: number;
  total_deals: number;
  total_amount: number;
  last_quote_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: number;
  quote_no: string;
  user_id: number;
  customer_id: number;
  status: string;
  product_total: number;
  fee_total: number;
  discount_amount: number;
  grand_total: number;
  payment_method?: string;
  payment_ratio?: number;
  delivery_days?: number;
  warranty_years?: number;
  valid_days?: number;
  remark?: string;
  sent_at?: string;
  deal_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteProduct {
  id: number;
  quote_id: number;
  product_category: string;
  profile_series_id: number;
  glass_config_id: number;
  color_id?: number;
  hardware_id?: number;
  opening_type?: string;
  width_mm: number;
  height_mm: number;
  area: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order: number;
  created_at: string;
}

export interface QuoteFee {
  id: number;
  quote_id: number;
  fee_name: string;
  fee_type: string;
  amount: number;
  remark?: string;
  sort_order: number;
  created_at: string;
}

export interface ProfileSeries {
  id: number;
  user_id: number;
  name: string;
  base_price: number;
  wall_thickness: number;
  description?: string;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GlassConfig {
  id: number;
  user_id: number;
  name: string;
  specification: string;
  price_add: number;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ColorOption {
  id: number;
  user_id: number;
  name: string;
  color_code?: string;
  price_add: number;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HardwareOption {
  id: number;
  user_id: number;
  name: string;
  type: string;
  price_per_unit: number;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}