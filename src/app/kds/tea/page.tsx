'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Ticket } from '@/lib/supabase'
import KdsTicket from '@/components/KdsTicket'
import { Coffee, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'

const STATUS_FILTERS = [
  { id: 'all', name: 'ทั้งหมด', color: 'bg-gray-500', icon: Coffee },
  { id: 'PENDING', name: 'รอทำ', color: 'bg-gray-500', icon: Clock },
  { id: 'IN_PROGRESS', name: 'กำลังทำ', color: 'bg-amber-500', icon: AlertTriangle },
  { id: 'READY', name: 'เสร็จแล้ว', color: 'bg-green-500', icon: CheckCircle },
]

export default function TeaKdsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // ตรวจสอบสิทธิ์การเข้าใช้
    const savedUser = localStorage.getItem('pos_user')
    const savedRole = localStorage.getItem('pos_role')
    
    if (!savedUser || !savedRole) {
      router.push('/login')
      return
    }
    
    if (!['KDS', 'Manager'].includes(savedRole)) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์เข้าใช้',
        text: 'หน้านี้สำหรับเจ้าหน้าที่ครัวเท่านั้น',
        confirmButtonColor: '#761F1C'
      }).then(() => {
        router.push('/')
      })
      return
    }

    loadTickets()
    setupRealtime()
  }, [router])

  const loadTickets = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('station', 'tea')
        .order('created_at', { ascending: true })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดออเดอร์ได้',
        text: 'กรุณาลองใหม่อีกครั้ง',
        confirmButtonColor: '#761F1C'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('tea_tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: 'station=eq.tea'
        },
        (payload) => {
          console.log('Realtime tea ticket update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [...prev, payload.new as Ticket])
            
            // แสดงการแจ้งเตือนออเดอร์ใหม่
            showNewOrderNotification(payload.new as Ticket)
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => 
              prev.map(ticket => 
                ticket.id === payload.new.id ? payload.new as Ticket : ticket
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(ticket => ticket.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showNewOrderNotification = (ticket: Ticket) => {
    // สร้างเสียงแจ้งเตือน
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ออเดอร์เครื่องดื่มใหม่!', {
        body: `ออเดอร์ ${ticket.order_number} - ${ticket.items.length} รายการ`,
        icon: '/icon-192.png',
        tag: `tea-order-${ticket.id}`
      })
    }

    // แสดง Toast notification
    Swal.fire({
      icon: 'info',
      title: 'ออเดอร์เครื่องดื่มใหม่!',
      text: `ออเดอร์ ${ticket.order_number}${ticket.table_number ? ` โต๊ะ ${ticket.table_number}` : ''}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      background: '#8B5CF6',
      color: 'white'
    })
  }

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'READY') => {
    try {
      const updates: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // อัปเดต timestamp ตามสถานะ
      if (newStatus === 'IN_PROGRESS') {
        updates.started_at = new Date().toISOString()
      } else if (newStatus === 'READY') {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)

      if (error) throw error

      // แสดงการแจ้งเตือนสำเร็จ
      const statusText = newStatus === 'IN_PROGRESS' ? 'เริ่มทำแล้ว' : 'เสร็จแล้ว'
      Swal.fire({
        icon: 'success',
        title: statusText,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      })

    } catch (error) {
      console.error('Error updating ticket status:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่',
        confirmButtonColor: '#EF4444'
      })
    }
  }

  const filteredTickets = selectedStatus === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === selectedStatus)

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      PENDING: tickets.filter(t => t.status === 'PENDING').length,
      IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      READY: tickets.filter(t => t.status === 'READY').length,
    }
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดออเดอร์เครื่องดื่ม...</p>
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
              <div className="p-3 bg-purple-600 text-white rounded-lg">
                <Coffee className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KDS - เครื่องดื่ม</h1>
                <p className="text-gray-600">จัดการออเดอร์เครื่องดื่มและของหวาน</p>
              </div>
            </div>

            {/* Live Status */}
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">ออนไลน์</span>
              </div>
              <p className="text-sm text-gray-500">
                ออเดอร์ทั้งหมด: {tickets.length}
              </p>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-3">
            {STATUS_FILTERS.map(status => {
              const Icon = status.icon
              const count = statusCounts[status.id as keyof typeof statusCounts] || 0
              const isActive = selectedStatus === status.id

              return (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? `${status.color} text-white shadow-md scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{status.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tickets Grid */}
        {filteredTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map(ticket => (
              <KdsTicket
                key={ticket.id}
                ticket={ticket}
                onUpdateStatus={handleUpdateTicketStatus}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'ไม่มีออเดอร์เครื่องดื่ม' : `ไม่มีออเดอร์${STATUS_FILTERS.find(s => s.id === selectedStatus)?.name}`}
            </h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'รอออเดอร์ใหม่จากหน้าร้าน' 
                : 'เลือกสถานะอื่นเพื่อดูออเดอร์'
              }
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รอทำ</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.PENDING}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">กำลังทำ</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.IN_PROGRESS}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">เสร็จแล้ว</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.READY}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ทั้งหมด</p>
                <p className="text-2xl font-bold text-purple-600">{statusCounts.all}</p>
              </div>
              <Coffee className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}