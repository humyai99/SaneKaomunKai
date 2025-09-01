'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Order, Payment } from '@/lib/supabase'
import { formatCurrency, formatDateTime, getOrderAge } from '@/lib/utils'
import { Search, Filter, Users, Car, Phone, Clock, CreditCard, DollarSign, Printer } from 'lucide-react'
import Swal from 'sweetalert2'

const ORDER_TYPE_ICONS = {
  dine_in: Users,
  takeaway: Car,
  delivery: Phone
}

const ORDER_TYPE_LABELS = {
  dine_in: 'นั่งทาน',
  takeaway: 'กลับบ้าน',
  delivery: 'เดลิเวอรี่'
}

const TABS = [
  { id: 'UNPAID', name: 'ยังไม่จ่าย', color: 'text-orange-600 bg-orange-100' },
  { id: 'PAID', name: 'จ่ายแล้ว', color: 'text-green-600 bg-green-100' }
]

export default function BillsPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedTab, setSelectedTab] = useState<'UNPAID' | 'PAID'>('UNPAID')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ตรวจสอบสิทธิ์การเข้าใช้
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    
    if (!savedUser || !savedRole) {
      router.push('/login')
      return
    }
    
    if (!['POS', 'Manager'].includes(savedRole)) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์เข้าใช้',
        text: 'หน้านี้สำหรับพนักงานขายและผู้จัดการเท่านั้น',
        confirmButtonColor: '#761F1C'
      }).then(() => {
        router.push('/')
      })
      return
    }

    loadOrders()
    setupRealtime()
  }, [router])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      setOrders(ordersData || [])
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลบิลได้',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtime = () => {
    const ordersChannel = supabase
      .channel('orders_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Realtime order update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
            showNewOrderNotification(payload.new as Order)
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(order => 
                order.id === payload.new.id ? payload.new as Order : order
              )
            )
          }
        }
      )
      .subscribe()

    const paymentsChannel = supabase
      .channel('payments_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Realtime payment update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setPayments(prev => [payload.new as Payment, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
      supabase.removeChannel(paymentsChannel)
    }
  }

  const showNewOrderNotification = (order: Order) => {
    Swal.fire({
      icon: 'info',
      title: 'ออเดอร์ใหม่!',
      text: `ออเดอร์ ${order.order_number}${order.table_number ? ` โต๊ะ ${order.table_number}` : ''} - ${formatCurrency(order.total_amount)}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      background: '#3B82F6',
      color: 'white'
    })
  }

  const filteredOrders = orders.filter(order => {
    // Filter by bill status (tab)
    if (order.bill_status !== selectedTab) return false
    
    // Filter by order type
    if (selectedOrderType !== 'all' && order.order_type !== selectedOrderType) return false
    
    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(search) ||
        (order.table_number && order.table_number.toLowerCase().includes(search)) ||
        (order.contact_info && order.contact_info.toLowerCase().includes(search))
      )
    }
    
    return true
  })

  const handlePayment = async (order: Order, paymentMethod: 'cash' | 'card' | 'transfer') => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการชำระเงิน',
      html: `
        <div class="text-left">
          <p><strong>ออเดอร์:</strong> ${order.order_number}</p>
          ${order.table_number ? `<p><strong>โต๊ะ:</strong> ${order.table_number}</p>` : ''}
          <p><strong>จำนวนเงิน:</strong> ${formatCurrency(order.total_amount)}</p>
          <p><strong>วิธีชำระ:</strong> ${getPaymentMethodLabel(paymentMethod)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ชำระเงิน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#22C55E',
      cancelButtonColor: '#6B7280'
    })

    if (!result.isConfirmed) return

    try {
      // Insert payment record
      const paymentData = {
        order_id: order.id,
        amount: order.total_amount,
        method: paymentMethod,
        user_id: localStorage.getItem('pos_user') || 'unknown',
        user_name: localStorage.getItem('pos_user') || 'Unknown User'
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData])

      if (paymentError) throw paymentError

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ bill_status: 'PAID', updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (orderError) throw orderError

      await Swal.fire({
        icon: 'success',
        title: 'ชำระเงินสำเร็จ!',
        text: `ออเดอร์ ${order.order_number} ชำระเงินแล้ว`,
        confirmButtonColor: '#22C55E',
        timer: 2000
      })

    } catch (error) {
      console.error('Error processing payment:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกการชำระเงินได้ กรุณาลองใหม่',
        confirmButtonColor: '#EF4444'
      })
    }
  }

  const handlePrintReceipt = (order: Order) => {
    // จำลองการพิมพ์ใบเสร็จ
    const receiptContent = generateReceiptContent(order)
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(receiptContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const generateReceiptContent = (order: Order): string => {
    const payment = payments.find(p => p.order_id === order.id)
    
    return `
      <html>
        <head>
          <title>ใบเสร็จ - ${order.order_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            .item-line { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-line { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>เสน่ห์ข้าวมันไก่</h2>
            <p>Sanae Hainanese Chicken Rice</p>
          </div>
          
          <p><strong>ออเดอร์:</strong> ${order.order_number}</p>
          <p><strong>วันที่:</strong> ${formatDateTime(order.created_at)}</p>
          ${order.table_number ? `<p><strong>โต๊ะ:</strong> ${order.table_number}</p>` : ''}
          <p><strong>ประเภท:</strong> ${ORDER_TYPE_LABELS[order.order_type]}</p>
          ${order.contact_info ? `<p><strong>เบอร์โทร:</strong> ${order.contact_info}</p>` : ''}
          
          <div style="margin: 15px 0;">
            ${order.items.map(item => `
              <div class="item-line">
                <span>${item.menu_item_name} x${item.quantity}</span>
                <span>${formatCurrency(item.unit_price * item.quantity)}</span>
              </div>
              ${item.modifiers?.length ? item.modifiers.map(mod => `
                <div style="margin-left: 10px; font-size: 10px; color: #666;">
                  + ${mod}
                </div>
              `).join('') : ''}
            `).join('')}
            
            <div class="total-line">
              <div class="item-line">
                <span>รวมทั้งสิ้น</span>
                <span>${formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
          
          ${payment ? `
            <p><strong>วิธีชำระ:</strong> ${getPaymentMethodLabel(payment.method)}</p>
            <p><strong>ชำระเมื่อ:</strong> ${formatDateTime(payment.created_at)}</p>
          ` : ''}
          
          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>Thank you for your visit!</p>
          </div>
        </body>
      </html>
    `
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'เงินสด'
      case 'card': return 'บัตรเครดิต'
      case 'transfer': return 'โอนเงิน'
      default: return method
    }
  }

  const getOrderTypeIcon = (type: keyof typeof ORDER_TYPE_ICONS) => {
    const Icon = ORDER_TYPE_ICONS[type]
    return <Icon className="h-4 w-4" />
  }

  const getTabCounts = () => {
    return {
      UNPAID: orders.filter(o => o.bill_status === 'UNPAID').length,
      PAID: orders.filter(o => o.bill_status === 'PAID').length
    }
  }

  const tabCounts = getTabCounts()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลบิล...</p>
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
              <div className="p-3 bg-blue-600 text-white rounded-lg">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการบิล</h1>
                <p className="text-gray-600">ตรวจสอบและชำระเงินออเดอร์</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">ออนไลน์</span>
              </div>
              <p className="text-sm text-gray-500">
                ยังไม่จ่าย: {tabCounts.UNPAID} | จ่ายแล้ว: {tabCounts.PAID}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200 inline-flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as 'UNPAID' | 'PAID')}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                selectedTab === tab.id
                  ? `${tab.color}`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.name} ({tab.id === 'UNPAID' ? tabCounts.UNPAID : tabCounts.PAID})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยหมายเลขออเดอร์, โต๊ะ, หรือเบอร์โทร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {/* Order Type Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedOrderType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedOrderType === 'all'
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ทั้งหมด
              </button>
              {Object.entries(ORDER_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedOrderType(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedOrderType === key
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getOrderTypeIcon(key as keyof typeof ORDER_TYPE_ICONS)}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const orderAge = getOrderAge(order.created_at)
              const payment = payments.find(p => p.order_id === order.id)
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getOrderTypeIcon(order.order_type)}
                        <span className="font-semibold text-lg text-gray-900">
                          ออเดอร์ {order.order_number}
                        </span>
                      </div>
                      
                      {order.table_number && (
                        <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                          โต๊ะ {order.table_number}
                        </span>
                      )}
                      
                      <span className={`status-badge ${order.bill_status === 'PAID' ? 'paid' : 'unpaid'}`}>
                        {order.bill_status === 'PAID' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-brand-primary">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(order.created_at)} ({orderAge} นาทีที่แล้ว)
                      </p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ประเภท:</span>
                        <span className="ml-2 font-medium">{ORDER_TYPE_LABELS[order.order_type]}</span>
                      </div>
                      {order.contact_info && (
                        <div>
                          <span className="text-gray-600">เบอร์โทร:</span>
                          <span className="ml-2 font-medium">{order.contact_info}</span>
                        </div>
                      )}
                      {order.delivery_platform && (
                        <div>
                          <span className="text-gray-600">แพลตฟอร์ม:</span>
                          <span className="ml-2 font-medium">{order.delivery_platform}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium">{item.menu_item_name}</span>
                          <span className="ml-2 text-gray-600">x{item.quantity}</span>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-1">
                              {item.modifiers.map(modifier => (
                                <span
                                  key={modifier}
                                  className="inline-block text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded mr-1"
                                >
                                  + {modifier}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      {payment && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CreditCard className="h-4 w-4" />
                          <span>ชำระด้วย{getPaymentMethodLabel(payment.method)}</span>
                          <span>•</span>
                          <span>{formatDateTime(payment.created_at)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      {order.bill_status === 'UNPAID' ? (
                        <>
                          <button
                            onClick={() => handlePayment(order, 'cash')}
                            className="btn-success flex items-center space-x-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>เงินสด</span>
                          </button>
                          
                          <button
                            onClick={() => handlePayment(order, 'card')}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>บัตร</span>
                          </button>
                          
                          <button
                            onClick={() => handlePayment(order, 'transfer')}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <span>โอนเงิน</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Printer className="h-4 w-4" />
                          <span>พิมพ์ใบเสร็จ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              ไม่มีบิล{selectedTab === 'UNPAID' ? 'ที่ยังไม่จ่าย' : 'ที่จ่ายแล้ว'}
            </h3>
            <p className="text-gray-600">
              {selectedTab === 'UNPAID' 
                ? 'ยังไม่มีออเดอร์ที่รอชำระเงิน' 
                : 'ยังไม่มีการชำระเงิน'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}