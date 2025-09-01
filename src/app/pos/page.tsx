'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, MenuItem, OrderItem } from '@/lib/supabase'
import MenuCard from '@/components/MenuCard'
import { formatCurrency, generateOrderNumber } from '@/lib/utils'
import { Search, ShoppingCart, Trash2, Minus, Plus, Send, CreditCard, Printer, Filter, X } from 'lucide-react'
import Swal from 'sweetalert2'

interface CartItem extends OrderItem {
  id: string
}

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด', color: 'bg-gray-500' },
  { id: 'rice', name: 'ข้าว', color: 'bg-orange-500' },
  { id: 'noodles', name: 'ก๋วยเตี๋ยว', color: 'bg-yellow-500' },
  { id: 'appetizer', name: 'ของทาน', color: 'bg-green-500' },
  { id: 'dessert', name: 'ของหวาน', color: 'bg-pink-500' },
  { id: 'beverage', name: 'เครื่องดื่ม', color: 'bg-blue-500' },
  { id: 'tea', name: 'ชา', color: 'bg-purple-500' },
]

export default function POSPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [orderInfo, setOrderInfo] = useState<any>(null)

  useEffect(() => {
    // ตรวจสอบว่าได้ login และเลือก order type แล้วหรือไม่
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    const savedOrderInfo = localStorage.getItem('current_order_info')
    
    if (!savedUser || !savedRole) {
      router.push('/login')
      return
    }
    
    if (!savedOrderInfo) {
      router.push('/order-type')
      return
    }

    setOrderInfo(JSON.parse(savedOrderInfo))
    loadMenuItems()
  }, [router])

  const loadMenuItems = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })
        .order('name_th', { ascending: true })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error loading menu items:', error)
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดเมนูได้',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(item => 
        item.name_th.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (item.description && item.description.toLowerCase().includes(search))
      )
    }

    return filtered
  }, [menuItems, selectedCategory, searchTerm])

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0)
  }, [cart])

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const handleAddToCart = (menuItem: MenuItem, quantity: number, modifiers?: string[]) => {
    const cartItemId = `${menuItem.id}-${JSON.stringify(modifiers || [])}`
    
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === cartItemId)
      
      if (existingIndex >= 0) {
        // Update existing item
        const updatedCart = [...prevCart]
        updatedCart[existingIndex].quantity += quantity
        return updatedCart
      } else {
        // Add new item
        const newItem: CartItem = {
          id: cartItemId,
          menu_item_id: menuItem.id,
          menu_item_name: menuItem.name_th,
          quantity,
          unit_price: menuItem.price,
          modifiers: modifiers || []
        }
        return [...prevCart, newItem]
      }
    })

    // Show success feedback
    Swal.fire({
      icon: 'success',
      title: 'เพิ่มในตะกร้าแล้ว',
      text: `${menuItem.name_th} x${quantity}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500
    })
  }

  const updateCartItemQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId))
  }

  const clearCart = () => {
    Swal.fire({
      icon: 'warning',
      title: 'ล้างตะกร้า?',
      text: 'คุณต้องการล้างสินค้าในตะกร้าทั้งหมดหรือไม่?',
      showCancelButton: true,
      confirmButtonText: 'ล้าง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280'
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([])
      }
    })
  }

  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ตะกร้าว่าง',
        text: 'กรุณาเลือกสินค้าก่อนส่งไปครัว',
        confirmButtonColor: '#761F1C'
      })
      return
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'ส่งออเดอร์ไปครัว?',
      html: `
        <div class="text-left">
          <p><strong>ประเภท:</strong> ${getOrderTypeLabel(orderInfo.orderType)}</p>
          ${orderInfo.tableNumber ? `<p><strong>โต๊ะ:</strong> ${orderInfo.tableNumber}</p>` : ''}
          ${orderInfo.contactInfo ? `<p><strong>เบอร์โทร:</strong> ${orderInfo.contactInfo}</p>` : ''}
          <p><strong>รวม:</strong> ${formatCurrency(cartTotal)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ส่งไปครัว',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#761F1C',
      cancelButtonColor: '#6B7280'
    })

    if (!result.isConfirmed) return

    setIsSending(true)

    try {
      const orderNumber = generateOrderNumber()
      const orderData = {
        order_number: orderNumber,
        table_number: orderInfo.tableNumber || null,
        order_type: orderInfo.orderType,
        contact_info: orderInfo.contactInfo || null,
        delivery_platform: orderInfo.deliveryPlatform || null,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          modifiers: item.modifiers || [],
          notes: item.notes || ''
        })),
        total_amount: cartTotal,
        bill_status: 'UNPAID',
        order_status: 'PENDING',
        user_id: localStorage.getItem('pos_user') || 'unknown',
        user_name: localStorage.getItem('pos_user') || 'Unknown User'
      }

      const { error } = await supabase
        .from('orders')
        .insert([orderData])

      if (error) throw error

      await Swal.fire({
        icon: 'success',
        title: 'ส่งไปครัวแล้ว!',
        text: `หมายเลขออเดอร์: ${orderNumber}`,
        confirmButtonColor: '#22C55E',
        timer: 2000
      })

      // Clear cart และกลับไปเลือก order type ใหม่
      setCart([])
      localStorage.removeItem('current_order_info')
      router.push('/order-type')

    } catch (error) {
      console.error('Error creating order:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งออเดอร์ไปครัวได้ กรุณาลองใหม่',
        confirmButtonColor: '#EF4444'
      })
    } finally {
      setIsSending(false)
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'dine_in': return 'นั่งทาน'
      case 'takeaway': return 'กลับบ้าน'
      case 'delivery': return 'เดลิเวอรี่'
      default: return type
    }
  }

  const getCartItemKey = (item: CartItem) => {
    return `${item.menu_item_name}-${item.modifiers?.join(',') || ''}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดเมนู...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Order Info */}
        {orderInfo && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {getOrderTypeLabel(orderInfo.orderType)}
                </h1>
                {orderInfo.tableNumber && (
                  <span className="bg-brand-primary text-white px-3 py-1 rounded-full font-medium">
                    โต๊ะ {orderInfo.tableNumber}
                  </span>
                )}
                {orderInfo.deliveryPlatform && (
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                    {orderInfo.deliveryPlatform}
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push('/order-type')}
                className="text-sm text-gray-600 hover:text-brand-primary"
              >
                เปลี่ยนประเภทออเดอร์
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาเมนู..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex overflow-x-auto space-x-2 pb-2 sm:pb-0">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? `${category.color} text-white shadow-md`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {(searchTerm || selectedCategory !== 'all') && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}
                    className="text-sm text-gray-600 hover:text-brand-primary flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>ล้างตัวกรอง</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {filteredMenuItems.length > 0 ? (
                <div className="pos-grid">
                  {filteredMenuItems.map(item => {
                    const inCartCount = cart
                      .filter(cartItem => cartItem.menu_item_id === item.id)
                      .reduce((total, cartItem) => total + cartItem.quantity, 0)

                    return (
                      <MenuCard
                        key={item.id}
                        item={item}
                        onAddToCart={handleAddToCart}
                        inCart={inCartCount}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">ไม่พบเมนูที่ค้นหา</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Cart Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>ตะกร้า ({cartItemCount})</span>
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>ล้าง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {cart.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {cart.map(item => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.menu_item_name}</h3>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-1">
                              {item.modifiers.map(modifier => (
                                <span
                                  key={modifier}
                                  className="inline-block text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded mr-1 mb-1"
                                >
                                  + {modifier}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatCurrency(item.unit_price)} x {item.quantity}</p>
                          <p className="font-semibold text-brand-primary">{formatCurrency(item.unit_price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Cart Total */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>รวมทั้งสิ้น</span>
                      <span className="text-brand-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ตะกร้าว่าง</p>
                  <p className="text-sm">เลือกเมนูเพื่อเริ่มสั่งอาหาร</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {cart.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={handleSendToKitchen}
                  disabled={isSending}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>{isSending ? 'กำลังส่ง...' : 'ส่งไปครัว'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}