'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Car, Phone, ArrowRight } from 'lucide-react'
import Swal from 'sweetalert2'

const ORDER_TYPES = [
  {
    id: 'dine_in',
    name: 'นั่งทาน',
    description: 'ลูกค้านั่งทานในร้าน',
    icon: Users,
    color: 'bg-blue-500',
    requiresTable: true,
  },
  {
    id: 'takeaway',
    name: 'กลับบ้าน',
    description: 'ลูกค้าซื้อกลับบ้าน',
    icon: Car,
    color: 'bg-green-500',
    requiresTable: false,
  },
  {
    id: 'delivery',
    name: 'เดลิเวอรี่',
    description: 'ส่งถึงที่ลูกค้า',
    icon: Phone,
    color: 'bg-orange-500',
    requiresTable: false,
  },
]

const DELIVERY_PLATFORMS = [
  'GrabFood',
  'FoodPanda',
  'LINE MAN',
  'Shopee Food',
  'GoFood',
  'อื่นๆ'
]

export default function OrderTypePage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [deliveryPlatform, setDeliveryPlatform] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // ตรวจสอบว่าได้ login แล้วหรือไม่
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    if (!savedUser || !savedRole) {
      router.push('/login')
    }
  }, [router])

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    setTableNumber('')
    setContactInfo('')
    setDeliveryPlatform('')
  }

  const handleContinue = async () => {
    if (!selectedType) return

    const selectedTypeConfig = ORDER_TYPES.find(t => t.id === selectedType)!

    // Validation
    if (selectedType === 'dine_in' && !tableNumber.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุหมายเลขโต๊ะ',
        text: 'สำหรับออเดอร์นั่งทาน จำเป็นต้องระบุหมายเลขโต๊ะ',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
      return
    }

    if (selectedType === 'delivery' && (!contactInfo.trim() || !deliveryPlatform)) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกข้อมูลให้ครบ',
        text: 'สำหรับเดลิเวอรี่ จำเป็นต้องระบุเบอร์โทรและแพลตฟอร์ม',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
      return
    }

    setIsLoading(true)

    try {
      // บันทึกข้อมูลออเดอร์ใน localStorage
      const orderInfo = {
        orderType: selectedType,
        tableNumber: selectedType === 'dine_in' ? tableNumber : undefined,
        contactInfo: selectedType === 'delivery' ? contactInfo : undefined,
        deliveryPlatform: selectedType === 'delivery' ? deliveryPlatform : undefined,
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem('current_order_info', JSON.stringify(orderInfo))

      await new Promise(resolve => setTimeout(resolve, 500))

      router.push('/pos')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้างออเดอร์ใหม่ได้',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderAdditionalInfo = () => {
    if (!selectedType) return null

    if (selectedType === 'dine_in') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเลขโต๊ะ *
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="เช่น 1, 2, A1, VIP1"
              className="form-input text-center text-lg font-semibold"
              autoFocus
            />
          </div>
        </div>
      )
    }

    if (selectedType === 'takeaway') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรลูกค้า (ไม่บังคับ)
            </label>
            <input
              type="tel"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="form-input"
            />
          </div>
        </div>
      )
    }

    if (selectedType === 'delivery') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรลูกค้า *
            </label>
            <input
              type="tel"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="form-input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แพลตฟอร์มเดลิเวอรี่ *
            </label>
            <select
              value={deliveryPlatform}
              onChange={(e) => setDeliveryPlatform(e.target.value)}
              className="form-input"
            >
              <option value="">เลือกแพลตฟอร์ม</option>
              {DELIVERY_PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>
      )
    }

    return null
  }

  const selectedTypeConfig = selectedType ? ORDER_TYPES.find(t => t.id === selectedType) : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            เลือกประเภทออเดอร์
          </h1>
          <p className="text-gray-600">
            กรุณาเลือกว่าลูกค้าต้องการสั่งประเภทไหน
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Type Selection */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ประเภทออเดอร์
            </h2>
            
            <div className="space-y-4">
              {ORDER_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`group w-full p-6 border-2 rounded-xl transition-all duration-200 text-left focus-ring ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 hover:border-brand-primary hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${type.color} text-white ${
                        isSelected ? 'scale-110' : 'group-hover:scale-110'
                      } transition-transform duration-200`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold transition-colors ${
                          isSelected ? 'text-brand-primary' : 'text-gray-900 group-hover:text-brand-primary'
                        }`}>
                          {type.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="text-brand-primary">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              ข้อมูลเพิ่มเติม
            </h2>

            {selectedTypeConfig ? (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-lg ${selectedTypeConfig.color} text-white`}>
                    <selectedTypeConfig.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedTypeConfig.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedTypeConfig.description}
                    </p>
                  </div>
                </div>

                {renderAdditionalInfo()}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleContinue}
                    disabled={isLoading}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    <span>{isLoading ? 'กำลังสร้างออเดอร์...' : 'ไปหน้าสั่งอาหาร'}</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-xl text-center">
                <p className="text-gray-600">
                  กรุณาเลือกประเภทออเดอร์ก่อน
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}