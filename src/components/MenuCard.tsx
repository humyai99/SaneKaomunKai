'use client'

import React, { useState } from 'react'
import { MenuItem } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Plus, Minus, Package } from 'lucide-react'

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem, quantity: number, modifiers?: string[]) => void
  inCart?: number
}

export default function MenuCard({ item, onAddToCart, inCart = 0 }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      await onAddToCart(item, quantity, selectedModifiers)
      setQuantity(1)
      setSelectedModifiers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleModifierToggle = (modifier: string) => {
    setSelectedModifiers(prev => 
      prev.includes(modifier)
        ? prev.filter(m => m !== modifier)
        : [...prev, modifier]
    )
  }

  return (
    <div className="menu-card group relative">
      {/* รูปภาพเมนู */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        {item.image_url ? (
          <picture>
            <source 
              srcSet={`${item.image_url}?format=avif&width=400 400w, ${item.image_url}?format=avif&width=800 800w`}
              sizes="(max-width: 768px) 400px, 800px"
              type="image/avif"
            />
            <source 
              srcSet={`${item.image_url}?format=webp&width=400 400w, ${item.image_url}?format=webp&width=800 800w`}
              sizes="(max-width: 768px) 400px, 800px"
              type="image/webp"
            />
            <img
              src={`${item.image_url}?width=400`}
              alt={item.name_th}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 768px) 400px, 800px"
            />
          </picture>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Badge สถานะ */}
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-status-breach text-white px-3 py-1 rounded-full text-sm font-medium">
              หมด
            </span>
          </div>
        )}
        
        {/* Badge จำนวนในตะกร้า */}
        {inCart > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-brand-primary text-white px-2 py-1 rounded-full text-xs font-medium">
              {inCart}
            </span>
          </div>
        )}
      </div>

      {/* ข้อมูลเมนู */}
      <div className="p-4 space-y-3">
        {/* ชื่อและราคา */}
        <div>
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {item.name_th}
          </h3>
          {item.name !== item.name_th && (
            <p className="text-sm text-gray-500 mt-1">{item.name}</p>
          )}
          <p className="text-xl font-bold text-brand-primary mt-2">
            {formatCurrency(item.price)}
          </p>
        </div>

        {/* คำอธิบาย */}
        {item.description && (
          <p className="text-sm text-gray-600 text-truncate-2">
            {item.description}
          </p>
        )}

        {/* Modifiers */}
        {item.modifiers && item.modifiers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">เพิ่มเติม:</p>
            <div className="flex flex-wrap gap-1">
              {item.modifiers.map(modifier => (
                <button
                  key={modifier}
                  onClick={() => handleModifierToggle(modifier)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    selectedModifiers.includes(modifier)
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-brand-primary'
                  }`}
                >
                  {modifier}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          {/* Quantity Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-ring"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors focus-ring"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={!item.available || isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus-ring ${
              item.available && !isLoading
                ? 'btn-primary hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? 'กำลังเพิ่ม...' : 'เพิ่ม'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}