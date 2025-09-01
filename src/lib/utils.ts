import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// เวลา & รูปแบบวันที่
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount)
}

// SLA และสีสถานะ
export function getOrderAge(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60)
}

export function getSLAColor(ageMinutes: number, orderType: string): string {
  const slaThreshold = orderType === 'dine_in' ? 15 : 20
  
  if (ageMinutes < slaThreshold * 0.7) return 'text-status-ready'
  if (ageMinutes < slaThreshold) return 'text-status-progress'
  return 'text-status-breach'
}

export function getSLABadgeColor(ageMinutes: number, orderType: string): string {
  const slaThreshold = orderType === 'dine_in' ? 15 : 20
  
  if (ageMinutes < slaThreshold * 0.7) return 'bg-status-ready'
  if (ageMinutes < slaThreshold) return 'bg-status-progress'
  return 'bg-status-breach'
}

// Debounce สำหรับค้นหา
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// Export CSV
export function exportToCSV(data: any[], filename: string) {
  if (!data.length) return
  
  const keys = Object.keys(data[0])
  const csv = [
    keys.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Validate PIN
export function validatePIN(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

// Generate order number
export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  
  return `${date}${month}${hours}${minutes}${random}`
}