'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, ShoppingCart, Coffee, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<string>('')

  useEffect(() => {
    // โหลดข้อมูลผู้ใช้
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    
    if (!savedUser || !savedRole) {
      router.push('/login')
      return
    }
    
    setCurrentUser(savedUser)
    setUserRole(savedRole)
  }, [router])

  const quickActions = [
    {
      title: 'POS - รับออเดอร์',
      description: 'เริ่มรับออเดอร์ใหม่จากลูกค้า',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      href: '/order-type',
      roles: ['POS', 'Manager']
    },
    {
      title: 'KDS - ครัว',
      description: 'จัดการออเดอร์อาหารจานหลัก',
      icon: ChefHat,
      color: 'bg-green-500',
      href: '/kds/kitchen',
      roles: ['KDS', 'Manager']
    },
    {
      title: 'KDS - เครื่องดื่ม',
      description: 'จัดการออเดอร์เครื่องดื่มและของหวาน',
      icon: Coffee,
      color: 'bg-purple-500',
      href: '/kds/tea',
      roles: ['KDS', 'Manager']
    },
    {
      title: 'จัดการบิล',
      description: 'ตรวจสอบและชำระเงินออเดอร์',
      icon: FileText,
      color: 'bg-orange-500',
      href: '/bills',
      roles: ['POS', 'Manager']
    },
    {
      title: 'รายงาน',
      description: 'ดูรายงานยอดขายและจัดการระบบ',
      icon: BarChart3,
      color: 'bg-red-500',
      href: '/manager',
      roles: ['Manager']
    }
  ]

  const visibleActions = quickActions.filter(action => 
    action.roles.includes(userRole)
  )

  const stats = [
    {
      name: 'ออเดอร์วันนี้',
      value: '24',
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'ยอดขายวันนี้',
      value: '฿2,450',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'เวลาเฉลี่ย',
      value: '12 นาที',
      icon: Clock,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      name: 'ลูกค้าวันนี้',
      value: '18',
      icon: Users,
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#761F1C] mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#761F1C] to-[#5A1813] rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  สวัสดี, {currentUser}!
                </h1>
                <p className="text-white/80 text-lg">
                  ยินดีต้อนรับสู่ระบบ POS เสน่ห์ข้าวมันไก่
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {userRole}
                  </span>
                  <span className="text-white/60">•</span>
                  <span className="text-white/80 text-sm">
                    {new Date().toLocaleDateString('th-TH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <ChefHat className="h-20 w-20 text-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">เมนูหลัก</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#761F1C] focus-visible:ring-offset-2 text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#761F1C] transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">เคล็ดลับการใช้งาน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">การรับออเดอร์</p>
                <p className="text-sm text-gray-600 mt-1">
                  เลือกประเภทออเดอร์ก่อน (นั่งทาน/กลับบ้าน/เดลิเวอรี่) จากนั้นเลือกเมนูและส่งไปครัว
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">การจัดการครัว</p>
                <p className="text-sm text-gray-600 mt-1">
                  ใช้หน้า KDS เพื่อดูออเดอร์แบบ Real-time และอัปเดตสถานะการปรุงอาหาร
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">การชำระเงิน</p>
                <p className="text-sm text-gray-600 mt-1">
                  ตรวจสอบบิลในหน้า "จัดการบิล" และเลือกวิธีชำระเงิน (เงินสด/บัตร/โอนเงิน)
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-sm font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">รายงาน</p>
                <p className="text-sm text-gray-600 mt-1">
                  ดูสถิติยอดขายและส่งออกรายงานในหน้า "รายงาน" (เฉพาะผู้จัดการ)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}