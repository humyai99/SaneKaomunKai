// IndexedDB สำหรับ offline queue
interface QueueItem {
  id: string
  type: 'order' | 'payment' | 'ticket_update'
  data: any
  timestamp: number
  retries: number
}

class OfflineQueue {
  private dbName = 'sanae_pos_offline'
  private dbVersion = 1
  private storeName = 'queue'
  
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('type', 'type', { unique: false })
        }
      }
    })
  }
  
  async addToQueue(type: QueueItem['type'], data: any): Promise<void> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    const item: QueueItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    }
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getQueueItems(): Promise<QueueItem[]> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }
  
  async removeFromQueue(id: string): Promise<void> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async updateRetryCount(id: string, retries: number): Promise<void> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retries = retries
          const putRequest = store.put(item)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }
  
  async clearQueue(): Promise<void> {
    const db = await this.openDB()
    const transaction = db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineQueue = new OfflineQueue()

// ตรวจสอบสถานะออนไลน์
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(true)
  
  React.useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    
    function handleOffline() {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

// Service Worker Registration
export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('SW registered: ', registration)
      } catch (registrationError) {
        console.log('SW registration failed: ', registrationError)
      }
    })
  }
}