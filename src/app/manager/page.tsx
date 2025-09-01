'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, MenuItem, Order } from '@/lib/supabase'
import { formatCurrency, formatDateTime, exportToCSV } from '@/lib/utils'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Users,
  Download,
  Upload,
  Settings,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import Swal from 'sweetalert2'

interface DashboardStats {
  todaySales: number
  todayOrders: number
  averageOrderValue: number
  popularItems: Array<{ name: string; quantity: number }>
  hourlyData: Array<{ hour: string; orders: number; sales: number }>
}

export default function ManagerPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedDateRange, setSelectedDateRange] = useState('today')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'reports'>('dashboard')

  useEffect(() => {
    // ตรวจสอบสิทธิ์การเข้าใช้
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    
    if (!savedUser || !savedRole) {
      router.push('/login')
      return
    }
    
    if (savedRole !== 'Manager') {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์เข้าใช้',
        text: 'หน้านี้สำหรับผู้จัดการเท่านั้น',
        confirmButtonColor: '#761F1C'
      }).then(() => {
        router.push('/')
      })
      return
    }

    loadData()
    setupRealtime()
  }, [router, selectedDateRange])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Load menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .order('name_th', { ascending: true })

      if (menuError) throw menuError

      setOrders(ordersData || [])
      setMenuItems(menuData || [])
      
      // Calculate stats
      calculateStats(ordersData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลได้',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('manager_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Realtime manager update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id ? payload.new as Order : order
              )
            )
          }
          
          // Recalculate stats
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const calculateStats = (ordersData: Order[]) => {
    const today = new Date().toDateString()
    const todayOrders = ordersData.filter(order => 
      new Date(order.created_at).toDateString() === today
    )

    const todaySales = todayOrders.reduce((sum, order) => sum + order.total_amount, 0)
    const todayOrderCount = todayOrders.length
    const averageOrderValue = todayOrderCount > 0 ? todaySales / todayOrderCount : 0

    // Popular items today
    const itemCounts: Record<string, number> = {}
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.menu_item_name] = (itemCounts[item.menu_item_name] || 0) + item.quantity
      })
    })

    const popularItems = Object.entries(itemCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Hourly data for today
    const hourlyData: Array<{ hour: string; orders: number; sales: number }> = []
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = todayOrders.filter(order => {
        const orderHour = new Date(order.created_at).getHours()
        return orderHour === hour
      })
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        orders: hourOrders.length,
        sales: hourOrders.reduce((sum, order) => sum + order.total_amount, 0)
      })
    }

    setStats({
      todaySales,
      todayOrders: todayOrderCount,
      averageOrderValue,
      popularItems,
      hourlyData
    })
  }

  const handleExportReport = (type: 'orders' | 'sales' | 'menu') => {
    const today = new Date()
    const filename = `${type}_report_${today.getFullYear()}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getDate().toString().padStart(2, '0')}`

    switch (type) {
      case 'orders':
        exportToCSV(orders.map(order => ({
          order_number: order.order_number,
          table_number: order.table_number || '',
          order_type: order.order_type,
          total_amount: order.total_amount,
          bill_status: order.bill_status,
          order_status: order.order_status,
          created_at: formatDateTime(order.created_at),
          user_name: order.user_name
        })), filename)
        break

      case 'sales':
        const salesData = orders.reduce((acc, order) => {
          order.items.forEach(item => {
            const existing = acc.find(s => s.menu_item_name === item.menu_item_name)
            if (existing) {
              existing.total_quantity += item.quantity
              existing.total_sales += item.unit_price * item.quantity
            } else {
              acc.push({
                menu_item_name: item.menu_item_name,
                total_quantity: item.quantity,
                total_sales: item.unit_price * item.quantity
              })
            }
          })
          return acc
        }, [] as Array<{ menu_item_name: string; total_quantity: number; total_sales: number }>)

        exportToCSV(salesData, filename)
        break

      case 'menu':
        exportToCSV(menuItems.map(item => ({
          name_th: item.name_th,
          name: item.name,
          price: item.price,
          category: item.category,
          available: item.available ? 'Yes' : 'No',
          description: item.description || '',
          modifiers: item.modifiers?.join(', ') || ''
        })), filename)
        break
    }

    Swal.fire({
      icon: 'success',
      title: 'ส่งออกข้อมูลสำเร็จ!',
      text: `ดาวน์โหลดไฟล์ ${filename}.csv แล้ว`,
      confirmButtonColor: '#22C55E',
      timer: 2000
    })
  }

  const handleToggleMenuAvailability = async (itemId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available, updated_at: new Date().toISOString() })
        .eq('id', itemId)

      if (error) throw error

      setMenuItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, available } : item
        )
      )

      Swal.fire({
        icon: 'success',
        title: available ? 'เปิดขายแล้ว' : 'หยุดขายแล้ว',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      })

    } catch (error) {
      console.error('Error updating menu item:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัปเดตเมนูได้',
        confirmButtonColor: '#EF4444'
      })
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ยอดขายวันนี้</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.todaySales || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ออเดอร์วันนี้</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.todayOrders || 0}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ค่าเฉลี่ยต่อออเดอร์</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats?.averageOrderValue || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">เมนูทั้งหมด</p>
              <p className="text-2xl font-bold text-orange-600">{menuItems.length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts and Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูยอดนิยมวันนี้</h3>
          <div className="space-y-3">
            {stats?.popularItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-gray-600">{item.quantity} ชิ้น</span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ออเดอร์ล่าสุด</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-gray-600">
                    {order.table_number ? `โต๊ะ ${order.table_number}` : 'กลับบ้าน'} • 
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-primary">{formatCurrency(order.total_amount)}</p>
                  <span className={`status-badge ${order.bill_status === 'PAID' ? 'paid' : 'unpaid'}`}>
                    {order.bill_status === 'PAID' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderMenu = () => (
    <div className="space-y-6">
      {/* Menu Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">จัดการเมนู</h3>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>อัปโหลดรูป</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>เพิ่มเมนู</span>
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เมนู
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ราคา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4 flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name_th}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Settings className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name_th}</p>
                        <p className="text-sm text-gray-600">{item.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleMenuAvailability(item.id, !item.available)}
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        item.available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {item.available ? 'เปิดขาย' : 'หยุดขาย'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-brand-primary hover:text-brand-dark">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ส่งออกรายงาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExportReport('orders')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
          >
            <Download className="h-8 w-8 text-gray-400 group-hover:text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-gray-900">รายงานออเดอร์</p>
            <p className="text-sm text-gray-600">ส่งออกข้อมูลออเดอร์ทั้งหมด</p>
          </button>

          <button
            onClick={() => handleExportReport('sales')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
          >
            <BarChart3 className="h-8 w-8 text-gray-400 group-hover:text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-gray-900">รายงานยอดขาย</p>
            <p className="text-sm text-gray-600">ส่งออกสรุปยอดขายตามเมนู</p>
          </button>

          <button
            onClick={() => handleExportReport('menu')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
          >
            <Settings className="h-8 w-8 text-gray-400 group-hover:text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-gray-900">รายการเมนู</p>
            <p className="text-sm text-gray-600">ส่งออกข้อมูลเมนูทั้งหมด</p>
          </button>
        </div>
      </div>
    </div>
  )

  const TABS = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'menu', name: 'จัดการเมนู', icon: Settings },
    { id: 'reports', name: 'รายงาน', icon: Download },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-brand-primary text-white rounded-lg">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ผู้จัดการ</h1>
                <p className="text-gray-600">Dashboard และการจัดการระบบ</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">ระบบทำงานปกติ</span>
              </div>
              <p className="text-sm text-gray-500">
                อัปเดตล่าสุด: {formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200 inline-flex">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  )
}