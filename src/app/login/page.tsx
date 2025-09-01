'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validatePIN } from '@/lib/utils'
import { User, Lock, ChefHat, ShoppingCart, BarChart3, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

// Dummy PIN database (ในการใช้งานจริงควรใช้ database)
const VALID_PINS = {
  '1234': { name: 'แคชเชียร์ 1', roles: ['POS'] },
  '2345': { name: 'แคชเชียร์ 2', roles: ['POS'] },
  '3456': { name: 'พ่อครัว 1', roles: ['KDS'] },
  '4567': { name: 'พ่อครัว 2', roles: ['KDS'] },
  '9999': { name: 'ผู้จัดการ', roles: ['POS', 'KDS', 'Manager'] },
}

const ROLES = [
  {
    id: 'POS',
    name: 'POS - ขาย',
    description: 'รับออเดอร์ ชำระเงิน พิมพ์บิล',
    icon: ShoppingCart,
    color: 'bg-blue-500'
  },
  {
    id: 'KDS',
    name: 'KDS - ครัว',
    description: 'รับออเดอร์จากครัว จัดการเมนู',
    icon: ChefHat,
    color: 'bg-green-500'
  },
  {
    id: 'Manager',
    name: 'Manager - จัดการ',
    description: 'รายงาน จัดการเมนู ตั้งค่าระบบ',
    icon: BarChart3,
    color: 'bg-purple-500'
  }
]

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'pin' | 'role'>('pin')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; roles: string[] } | null>(null)

  useEffect(() => {
    // ตรวจสอบว่ามี session อยู่แล้วหรือไม่
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    if (savedUser && savedRole) {
      router.push('/order-type')
    }
  }, [router])

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePIN(pin)) {
      Swal.fire({
        icon: 'error',
        title: 'PIN ไม่ถูกต้อง',
        text: 'กรุณาใส่ PIN 4 หลัก',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
      return
    }

    setIsLoading(true)

    try {
      // จำลองการตรวจสอบ PIN
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = VALID_PINS[pin as keyof typeof VALID_PINS]
      
      if (user) {
        setUserInfo(user)
        if (user.roles.length === 1) {
          // ถ้ามีบทบาทเดียว ให้ไปต่อเลย
          await handleRoleSelect(user.roles[0], user.name)
        } else {
          // ถ้ามีหลายบทบาท ให้เลือก
          setStep('role')
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'PIN ไม่ถูกต้อง',
          text: 'กรุณาตรวจสอบ PIN อีกครั้ง',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#761F1C'
        })
        setPin('')
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = async (role: string, userName: string) => {
    setIsLoading(true)
    
    try {
      // จำลองการบันทึกข้อมูล session
      await new Promise(resolve => setTimeout(resolve, 500))
      
      localStorage.setItem('pos_user', userName)
      localStorage.setItem('pos_role', role)
      
      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: `ยินดีต้อนรับ ${userName}`,
        timer: 1500,
        showConfirmButton: false
      })
      
      router.push('/order-type')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinKeypad = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit)
    }
  }

  const handlePinClear = () => {
    setPin('')
  }

  const handleBackToPin = () => {
    setStep('pin')
    setPin('')
    setUserInfo(null)
  }

  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo และหัวข้อ */}
          <div className="text-center mb-8">
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ChefHat className="h-10 w-10 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              เสน่ห์ข้าวมันไก่
            </h1>
            <p className="text-white/80">
              ระบบขายหน้าร้าน
            </p>
          </div>

          {/* PIN Input Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-brand-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                เข้าสู่ระบบ
              </h2>
              <p className="text-gray-600">
                กรุณาใส่รหัส PIN 4 หลัก
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              {/* PIN Display */}
              <div className="flex justify-center space-x-3">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
                      pin.length > index
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {pin.length > index ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handlePinKeypad(digit.toString())}
                    className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 focus-ring"
                    disabled={isLoading}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handlePinClear}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 focus-ring"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinKeypad('0')}
                  className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 focus-ring"
                  disabled={isLoading}
                >
                  0
                </button>
                <button
                  type="submit"
                  className="h-12 btn-primary text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                  disabled={pin.length !== 4 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </button>
              </div>
            </form>

            {/* Demo PINs */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center mb-2">
                รหัสทดสอบ:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <span className="font-mono bg-white px-2 py-1 rounded">1234</span>
                  <p className="text-gray-600 mt-1">POS</p>
                </div>
                <div className="text-center">
                  <span className="font-mono bg-white px-2 py-1 rounded">3456</span>
                  <p className="text-gray-600 mt-1">ครัว</p>
                </div>
                <div className="text-center col-span-2">
                  <span className="font-mono bg-white px-2 py-1 rounded">9999</span>
                  <p className="text-gray-600 mt-1">ผู้จัดการ (ทุกบทบาท)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Role Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary to-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-8 w-8 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            เลือกบทบาทการทำงาน
          </h2>
          <p className="text-white/80">
            สวัสดี {userInfo?.name}
          </p>
        </div>

        {/* Role Cards */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="grid gap-4">
            {ROLES.filter(role => userInfo?.roles.includes(role.id)).map(role => {
              const Icon = role.icon
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id, userInfo!.name)}
                  disabled={isLoading}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-brand-primary hover:bg-gray-50 transition-all duration-200 text-left focus-ring disabled:opacity-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${role.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">
                        {role.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {role.description}
                      </p>
                    </div>
                    {isLoading && (
                      <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleBackToPin}
              disabled={isLoading}
              className="w-full btn-secondary"
            >
              กลับไปใส่ PIN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}