import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types for our database schema
export interface MenuItem {
  id: string
  name: string
  name_th: string
  price: number
  category: 'rice' | 'noodles' | 'appetizer' | 'dessert' | 'beverage' | 'tea'
  image_url?: string
  available: boolean
  description?: string
  modifiers?: string[]
  created_at: string
}

export interface Order {
  id: string
  table_number?: string
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  contact_info?: string
  items: OrderItem[]
  total_amount: number
  bill_status: 'UNPAID' | 'PAID'
  order_status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED'
  created_at: string
  updated_at: string
  user_id: string
}

export interface OrderItem {
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  modifiers?: string[]
  notes?: string
}

export interface Ticket {
  id: string
  order_id: string
  station: 'kitchen' | 'tea'
  items: TicketItem[]
  status: 'PENDING' | 'IN_PROGRESS' | 'READY'
  priority: 'NORMAL' | 'HIGH'
  estimated_time?: number
  started_at?: string
  completed_at?: string
  created_at: string
  table_number?: string
  order_type: string
}

export interface TicketItem {
  menu_item_name: string
  quantity: number
  modifiers?: string[]
  notes?: string
}

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: 'cash' | 'card' | 'transfer'
  created_at: string
  user_id: string
}