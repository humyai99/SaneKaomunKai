import { supabase } from './supabase'
import type { MenuItem, Order, Ticket, Payment } from './supabase'

// Menu Items queries
export const menuQueries = {
  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })
      .order('name_th', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getByCategory(category: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category', category)
      .eq('available', true)
      .order('name_th', { ascending: true })

    if (error) throw error
    return data || []
  },

  async update(id: string, updates: Partial<MenuItem>): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async create(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([item])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Orders queries
export const orderQueries = {
  async getAll(limit?: number): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getByStatus(billStatus: 'UNPAID' | 'PAID'): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('bill_status', billStatus)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getToday(): Promise<Order[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(id: string, billStatus: 'UNPAID' | 'PAID'): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ 
        bill_status: billStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (error) throw error
  }
}

// Tickets queries
export const ticketQueries = {
  async getByStation(station: 'kitchen' | 'tea'): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('station', station)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async updateStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'READY'): Promise<void> {
    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }

    // Set timestamps based on status
    if (status === 'IN_PROGRESS') {
      updates.started_at = new Date().toISOString()
    } else if (status === 'READY') {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }
}

// Payments queries
export const paymentQueries = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getByOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data || null
  },

  async create(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Real-time subscriptions
export const subscriptions = {
  orders(callback: (payload: any) => void) {
    return supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        callback
      )
      .subscribe()
  },

  tickets(station: 'kitchen' | 'tea', callback: (payload: any) => void) {
    return supabase
      .channel(`tickets_${station}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `station=eq.${station}`
        },
        callback
      )
      .subscribe()
  },

  payments(callback: (payload: any) => void) {
    return supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        callback
      )
      .subscribe()
  }
}

// Analytics queries
export const analyticsQueries = {
  async getTodayStats() {
    const orders = await orderQueries.getToday()
    
    const todaySales = orders
      .filter(order => order.bill_status === 'PAID')
      .reduce((sum, order) => sum + order.total_amount, 0)
    
    const todayOrders = orders.length
    const averageOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0

    // Popular items
    const itemCounts: Record<string, number> = {}
    orders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.menu_item_name] = (itemCounts[item.menu_item_name] || 0) + item.quantity
      })
    })

    const popularItems = Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return {
      todaySales,
      todayOrders,
      averageOrderValue,
      popularItems,
      orders
    }
  },

  async getHourlyData() {
    const orders = await orderQueries.getToday()
    
    const hourlyData: Array<{ hour: string; orders: number; sales: number }> = []
    
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = orders.filter(order => {
        const orderHour = new Date(order.created_at).getHours()
        return orderHour === hour
      })
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        orders: hourOrders.length,
        sales: hourOrders.reduce((sum, order) => sum + order.total_amount, 0)
      })
    }

    return hourlyData
  },

  async getSalesReport(startDate?: string, endDate?: string) {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('bill_status', 'PAID')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: orders, error } = await query
    if (error) throw error

    const salesByItem: Record<string, { quantity: number; revenue: number }> = {}
    
    orders?.forEach(order => {
      order.items.forEach(item => {
        if (!salesByItem[item.menu_item_name]) {
          salesByItem[item.menu_item_name] = { quantity: 0, revenue: 0 }
        }
        salesByItem[item.menu_item_name].quantity += item.quantity
        salesByItem[item.menu_item_name].revenue += item.unit_price * item.quantity
      })
    })

    return {
      orders: orders || [],
      salesByItem,
      totalRevenue: Object.values(salesByItem).reduce((sum, item) => sum + item.revenue, 0),
      totalQuantity: Object.values(salesByItem).reduce((sum, item) => sum + item.quantity, 0)
    }
  }
}