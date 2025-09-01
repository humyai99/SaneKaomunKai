'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Wifi, WifiOff, User, Home, ShoppingCart, ChefHat, Coffee, FileText, BarChart3 } from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOnline, setIsOnline] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<string>('')

  useEffect(() => {
    // ตรวจสอบสถานะออนไลน์
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    updateOnlineStatus()

    // โหลดข้อมูลผู้ใช้จาก localStorage
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    if (savedUser) setCurrentUser(savedUser)
    if (savedRole) setUserRole(savedRole)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('pos_user')
    localStorage.removeItem('pos_role')
    router.push('/login')
  }

  const navigationItems = [
    { 
      name: 'หน้าแรก', 
      href: '/', 
      icon: Home,
      roles: ['POS', 'KDS', 'Manager']
    },
    { 
      name: 'POS', 
      href: '/pos', 
      icon: ShoppingCart,
      roles: ['POS', 'Manager']
    },
    { 
      name: 'ครัว', 
      href: '/kds/kitchen', 
      icon: ChefHat,
      roles: ['KDS', 'Manager']
    },
    { 
      name: 'เครื่องดื่ม', 
      href: '/kds/tea', 
      icon: Coffee,
      roles: ['KDS', 'Manager']
    },
    { 
      name: 'บิล', 
      href: '/bills', 
      icon: FileText,
      roles: ['POS', 'Manager']
    },
    { 
      name: 'รายงาน', 
      href: '/manager', 
      icon: BarChart3,
      roles: ['Manager']
    },
  ]

  // ซ่อน AppShell ในหน้า login
  if (pathname === '/login' || pathname === '/order-type') {
    return <>{children}</>
  }

  const visibleNavItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo และชื่อร้าน */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-brand-primary">
                  เสน่ห์ข้าวมันไก่
                </h1>
              </div>
              
              {/* Role Badge */}
              {userRole && (
                <div className="hidden sm:block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-primary text-white">
                    {userRole}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-700 hover:text-brand-primary hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>

            {/* User และสถานะออนไลน์ */}
            <div className="flex items-center space-x-4">
              {/* สถานะออนไลน์ */}
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-status-ready" />
                ) : (
                  <WifiOff className="h-5 w-5 text-status-breach" />
                )}
                <span className={`text-sm font-medium ${
                  isOnline ? 'text-status-ready' : 'text-status-breach'
                }`}>
                  {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>

              {/* ข้อมูลผู้ใช้ */}
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{currentUser}</span>
              </div>

              {/* ปุ่มออกจากระบบ */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3">
            <div className="flex space-x-1 overflow-x-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`flex-shrink-0 inline-flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-primary text-white'
                        : 'text-gray-700 hover:text-brand-primary hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-status-breach text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>ไม่มีการเชื่อมต่ออินเทอร์เน็ต - กำลังทำงานแบบออฟไลน์</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}