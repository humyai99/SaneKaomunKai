'use client'

import React, { useEffect, useState } from 'react'
import { Ticket } from '@/lib/supabase'
import { formatTime, getOrderAge, getSLAColor, getSLABadgeColor } from '@/lib/utils'
import { Clock, Users, Car, Phone, ChefHat, Play, Check } from 'lucide-react'

interface KdsTicketProps {
  ticket: Ticket
  onUpdateStatus: (ticketId: string, status: 'PENDING' | 'IN_PROGRESS' | 'READY') => void
}

export default function KdsTicket({ ticket, onUpdateStatus }: KdsTicketProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const orderAge = getOrderAge(ticket.created_at)
  const slaColor = getSLAColor(orderAge, ticket.order_type)
  const slaBadgeColor = getSLABadgeColor(orderAge, ticket.order_type)

  const getOrderTypeIcon = () => {
    switch (ticket.order_type) {
      case 'dine_in':
        return <Users className="h-4 w-4" />
      case 'takeaway':
        return <Car className="h-4 w-4" />
      case 'delivery':
        return <Phone className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getOrderTypeLabel = () => {
    switch (ticket.order_type) {
      case 'dine_in':
        return 'นั่งทาน'
      case 'takeaway':
        return 'กลับบ้าน'
      case 'delivery':
        return 'เดลิเวอรี่'
      default:
        return 'นั่งทาน'
    }
  }

  const getStatusButtonConfig = () => {
    switch (ticket.status) {
      case 'PENDING':
        return {
          text: 'เริ่มทำ',
          icon: Play,
          className: 'btn-warning',
          nextStatus: 'IN_PROGRESS' as const
        }
      case 'IN_PROGRESS':
        return {
          text: 'เสร็จแล้ว',
          icon: Check,
          className: 'btn-success',
          nextStatus: 'READY' as const
        }
      case 'READY':
        return null
    }
  }

  const statusButtonConfig = getStatusButtonConfig()

  return (
    <div className={`ticket-card ${ticket.status.toLowerCase()} ${
      orderAge > (ticket.order_type === 'dine_in' ? 15 : 20) ? 'breach' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {/* Station Badge */}
          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-brand-primary text-white">
            <ChefHat className="h-3 w-3" />
            <span>{ticket.station === 'kitchen' ? 'ครัว' : 'เครื่องดื่ม'}</span>
          </span>
          
          {/* Order Type */}
          <span className="inline-flex items-center space-x-1 text-xs text-gray-600">
            {getOrderTypeIcon()}
            <span>{getOrderTypeLabel()}</span>
            {ticket.table_number && (
              <span className="font-medium">โต๊ะ {ticket.table_number}</span>
            )}
          </span>
        </div>

        {/* Timer Badge */}
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white ${slaBadgeColor}`}>
          <Clock className="h-3 w-3" />
          <span>{orderAge} นาที</span>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        {ticket.items.map((item, index) => (
          <div key={index} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{item.menu_item_name}</span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  x{item.quantity}
                </span>
              </div>
              
              {/* Modifiers */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-1">
                  {item.modifiers.map(modifier => (
                    <span
                      key={modifier}
                      className="inline-block text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded mr-1"
                    >
                      + {modifier}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-orange-600 mt-1 italic">
                  หมายเหตุ: {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status และ Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`status-badge ${
            ticket.status === 'READY' ? 'ready' :
            ticket.status === 'IN_PROGRESS' ? 'progress' : ''
          }`}>
            {ticket.status === 'PENDING' && 'รอทำ'}
            {ticket.status === 'IN_PROGRESS' && 'กำลังทำ'}
            {ticket.status === 'READY' && 'เสร็จแล้ว'}
          </span>
          
          {/* Priority Badge */}
          {ticket.priority === 'HIGH' && (
            <span className="status-badge breach">
              🔥 ด่วน
            </span>
          )}
          
          {/* Order Time */}
          <span className="text-xs text-gray-500">
            สั่งเวลา {formatTime(ticket.created_at)}
          </span>
        </div>

        {/* Action Button */}
        {statusButtonConfig && (
          <button
            onClick={() => onUpdateStatus(ticket.id, statusButtonConfig.nextStatus)}
            className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 focus-ring ${statusButtonConfig.className}`}
          >
            <statusButtonConfig.icon className="h-4 w-4" />
            <span>{statusButtonConfig.text}</span>
          </button>
        )}
      </div>

      {/* Estimated Time */}
      {ticket.estimated_time && ticket.status === 'IN_PROGRESS' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 text-center">
            ประมาณการ: อีก {ticket.estimated_time} นาที
          </p>
        </div>
      )}
    </div>
  )
}