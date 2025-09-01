import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { toast } from 'sonner@2.0.3';
import { KitchenDisplay } from './components/KitchenDisplay';
import { BillsManagement } from './components/BillsManagement';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Toaster } from './components/Toaster';
import { 
  ShoppingCart, 
  Clock, 
  DollarSign, 
  Users, 
  Download, 
  Upload,
  Settings,
  LogOut,
  Phone,
  MapPin,
  Utensils,
  Coffee,
  CheckCircle,
  Circle,
  Play,
  Pause,
  Printer,
  ChefHat,
  CreditCard,
  Wallet,
  QrCode,
  FileText,
  BarChart3,
  Package,
  Timer,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

// ===== TYPES & INTERFACES =====
interface MenuItem {
  sku: string;
  name: string;
  price: number;
  category: 'rice' | 'drink' | 'tea' | 'side' | 'dessert';
  station: 'kitchen' | 'tea';
  imageUrl?: string;
  imageAlt?: string;
  modifiers?: Modifier[];
  available: boolean;
}

interface Modifier {
  id: string;
  name: string;
  price: number;
  category: 'sauce' | 'rice' | 'size' | 'extra';
  required?: boolean;
}

interface OrderItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: Modifier[];
  station: string;
  category: string;
  specialInstructions?: string;
}

interface Order {
  id: string;
  queueNumber: string;
  type: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  platform?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  payments: Payment[];
  notes?: string;
}

interface Payment {
  id: string;
  method: 'cash' | 'qr' | 'card' | 'transfer';
  amount: number;
  change?: number;
  reference?: string;
  paidAt: string;
  paidBy: string;
}

interface KDSTicket {
  id: string;
  orderId: string;
  queueNumber: string;
  station: 'kitchen' | 'tea';
  items: OrderItem[];
  status: 'new' | 'in-progress' | 'ready' | 'closed';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  closedAt?: string;
  slaMinutes: number;
  estimatedTime?: number;
  notes?: string;
  orderType: string;
  tableNumber?: string;
}

interface User {
  id: string;
  pin: string;
  role: 'pos' | 'kds' | 'manager' | 'admin';
  name: string;
  permissions: string[];
  lastLogin?: string;
  isActive: boolean;
}

interface AppState {
  users: User[];
  menu: MenuItem[];
  orders: Order[];
  kdsTickets: KDSTicket[];
  currentUser: User | null;
  currentOrder: Order | null;
  settings: {
    storeName: string;
    storeAddress: string;
    storePhone: string;
    taxRate: number;
    currency: string;
    kdsSlaMinutes: number;
    autoSaveInterval: number;
    printerConfig: any;
  };
  lastSaved: string;
  isOnline: boolean;
}

// ===== GLOBAL STATE =====
const initialState: AppState = {
  users: [
    {
      id: 'admin',
      pin: '1234',
      role: 'admin',
      name: 'Administrator',
      permissions: ['*'],
      isActive: true
    },
    {
      id: 'pos1',
      pin: '1111',
      role: 'pos',
      name: 'POS Staff',
      permissions: ['pos', 'bills'],
      isActive: true
    },
    {
      id: 'kitchen1',
      pin: '2222',
      role: 'kds',
      name: 'Kitchen Staff',
      permissions: ['kds'],
      isActive: true
    }
  ],
  menu: [
    {
      sku: 'A001',
      name: 'ข้าวมันไก่ธรรมดา',
      price: 50,
      category: 'rice',
      station: 'kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1743790769102-d0856d701466?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWluYW5lc2UlMjBjaGlja2VuJTIwcmljZSUyMHRoYWklMjBmb29kfGVufDF8fHx8MTc1NjcxMzI1NHww&ixlib=rb-4.1.0&q=80&w=400',
      imageAlt: 'ข้าวมันไก่ธรรมดา',
      available: true,
      modifiers: [
        { id: 'sauce-1', name: 'น้ำจิ้มแดง', price: 0, category: 'sauce' },
        { id: 'sauce-2', name: 'น้ำจิ้มเขียว', price: 0, category: 'sauce' },
        { id: 'extra-1', name: 'ไข่ลูกเขย', price: 10, category: 'extra' }
      ]
    },
    {
      sku: 'A003',
      name: 'ข้าวมันไก่ทอด',
      price: 60,
      category: 'rice',
      station: 'kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1615322712569-8eb81aa62f80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllZCUyMGNoaWNrZW4lMjByaWNlJTIwYXNpYW4lMjBmb29kfGVufDF8fHx8MTc1NjcxMzI2Mnww&ixlib=rb-4.1.0&q=80&w=400',
      imageAlt: 'ข้าวมันไก่ทอด',
      available: true,
      modifiers: [
        { id: 'sauce-1', name: 'น้ำจิ้มแดง', price: 0, category: 'sauce' },
        { id: 'sauce-2', name: 'น้ำจิ้มเขียว', price: 0, category: 'sauce' }
      ]
    },
    {
      sku: 'B001',
      name: 'ชาเย็น',
      price: 25,
      category: 'tea',
      station: 'tea',
      imageUrl: 'https://images.unsplash.com/photo-1731139126173-44f512735854?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFpJTIwaWNlZCUyMHRlYSUyMG9yYW5nZSUyMGRyaW5rfGVufDF8fHx8MTc1NjcxMzI1N3ww&ixlib=rb-4.1.0&q=80&w=400',
      imageAlt: 'ชาเย็น',
      available: true,
      modifiers: [
        { id: 'size-s', name: 'เล็ก', price: 0, category: 'size' },
        { id: 'size-l', name: 'ใหญ่', price: 5, category: 'size' }
      ]
    }
  ],
  orders: [],
  kdsTickets: [],
  currentUser: null,
  currentOrder: null,
  settings: {
    storeName: 'เสน่ห์ข้าวมันไก่',
    storeAddress: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
    storePhone: '02-123-4567',
    taxRate: 0.07,
    currency: 'THB',
    kdsSlaMinutes: 5,
    autoSaveInterval: 300000, // 5 minutes
    printerConfig: null
  },
  lastSaved: new Date().toISOString(),
  isOnline: navigator.onLine
};

// ===== MAIN APP COMPONENT =====
export default function App() {
  // State Management
  const [appState, setAppState] = useState<AppState>(initialState);
  const [currentView, setCurrentView] = useState<string>('login');
  const [selectedOrderType, setSelectedOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', platform: '' });

  // Authentication States
  const [pinInput, setPinInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [authError, setAuthError] = useState('');

  // POS States
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromStorage();
    
    // Auto-save interval
    const autoSaveInterval = setInterval(() => {
      saveToStorage();
    }, appState.settings.autoSaveInterval);

    // Online/offline status
    const handleOnline = () => setAppState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setAppState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ===== UTILITY FUNCTIONS =====
  
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const generateQueueNumber = () => {
    const today = new Date();
    const orders = appState.orders.filter(order => 
      order.createdAt.startsWith(today.toISOString().split('T')[0])
    );
    const number = (orders.length + 1).toString().padStart(3, '0');
    return `A${number}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: appState.settings.currency
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== STORAGE FUNCTIONS =====
  
  const saveToStorage = () => {
    try {
      const dataToSave = {
        ...appState,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('sanae-pos-data', JSON.stringify(dataToSave));
      setAppState(prev => ({ ...prev, lastSaved: new Date().toISOString() }));
      toast.success('ข้อมูลถูกบันทึกแล้ว');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('sanae-pos-data');
      if (saved) {
        const data = JSON.parse(saved);
        setAppState(data);
        toast.success('โหลดข้อมูลสำเร็จ');
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  const exportData = () => {
    try {
      const dataToExport = {
        ...appState,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanae-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('ส่งออกข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setAppState(data);
        saveToStorage();
        toast.success('นำเข้าข้อมูลสำเร็จ');
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('ไม่สามารถนำเข้าข้อมูลได้');
      }
    };
    reader.readAsText(file);
  };

  // ===== AUTHENTICATION =====
  
  const handlePinSubmit = () => {
    if (pinInput.length < 4) {
      setAuthError('กรุณาใส่ PIN 4-6 หลัก');
      return;
    }

    const matchingUsers = appState.users.filter(user => 
      user.pin === pinInput && user.isActive
    );

    if (matchingUsers.length === 0) {
      setAuthError('PIN ไม่ถูกต้อง');
      setPinInput('');
      return;
    }

    if (matchingUsers.length === 1) {
      login(matchingUsers[0]);
    } else {
      setShowRoleSelect(true);
      setAuthError('');
    }
  };

  const login = (user: User) => {
    setAppState(prev => ({
      ...prev,
      currentUser: { ...user, lastLogin: new Date().toISOString() }
    }));

    // Navigate based on role
    switch (user.role) {
      case 'pos':
        setCurrentView('order-type');
        break;
      case 'kds':
        setCurrentView('kds-kitchen');
        break;
      case 'manager':
      case 'admin':
        setCurrentView('manager');
        break;
      default:
        setCurrentView('order-type');
    }

    setPinInput('');
    setShowRoleSelect(false);
    setSelectedRole('');
    toast.success(`ยินดีต้อนรับ ${user.name}`);
  };

  const logout = () => {
    setAppState(prev => ({ ...prev, currentUser: null, currentOrder: null }));
    setCurrentView('login');
    setCart([]);
    toast.success('ออกจากระบบแล้ว');
  };

  // ===== POS FUNCTIONS =====
  
  const addToCart = (menuItem: MenuItem, modifiers: Modifier[] = []) => {
    const cartItem: OrderItem = {
      sku: menuItem.sku,
      name: menuItem.name,
      price: menuItem.price + modifiers.reduce((sum, mod) => sum + mod.price, 0),
      quantity: 1,
      modifiers,
      station: menuItem.station,
      category: menuItem.category
    };

    const existingIndex = cart.findIndex(item => 
      item.sku === cartItem.sku && 
      JSON.stringify(item.modifiers) === JSON.stringify(cartItem.modifiers)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }

    toast.success(`เพิ่ม ${menuItem.name} ลงตะกร้าแล้ว`);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const calculateCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * appState.settings.taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const submitOrder = () => {
    if (cart.length === 0) {
      toast.error('ตะกร้าว่าง กรุณาเลือกเมนู');
      return;
    }

    if (selectedOrderType === 'dine-in' && !tableNumber) {
      toast.error('กรุณาระบุหมายเลขโต๊ะ');
      return;
    }

    const { subtotal, tax, total } = calculateCartTotal();
    const order: Order = {
      id: generateId(),
      queueNumber: generateQueueNumber(),
      type: selectedOrderType,
      tableNumber: selectedOrderType === 'dine-in' ? tableNumber : undefined,
      customerName: customerInfo.name || undefined,
      customerPhone: customerInfo.phone || undefined,
      platform: selectedOrderType === 'delivery' ? customerInfo.platform : undefined,
      items: [...cart],
      subtotal,
      tax,
      total,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: appState.currentUser?.id || '',
      payments: []
    };

    // Create KDS tickets grouped by station
    const kitchenItems = cart.filter(item => item.station === 'kitchen');
    const teaItems = cart.filter(item => item.station === 'tea');

    const kdsTickets: KDSTicket[] = [];

    if (kitchenItems.length > 0) {
      kdsTickets.push({
        id: generateId(),
        orderId: order.id,
        queueNumber: order.queueNumber,
        station: 'kitchen',
        items: kitchenItems,
        status: 'new',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        slaMinutes: appState.settings.kdsSlaMinutes,
        orderType: order.type,
        tableNumber: order.tableNumber
      });
    }

    if (teaItems.length > 0) {
      kdsTickets.push({
        id: generateId(),
        orderId: order.id,
        queueNumber: order.queueNumber,
        station: 'tea',
        items: teaItems,
        status: 'new',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        slaMinutes: appState.settings.kdsSlaMinutes,
        orderType: order.type,
        tableNumber: order.tableNumber
      });
    }

    setAppState(prev => ({
      ...prev,
      orders: [...prev.orders, order],
      kdsTickets: [...prev.kdsTickets, ...kdsTickets],
      currentOrder: order
    }));

    // Reset form
    setCart([]);
    setTableNumber('');
    setCustomerInfo({ name: '', phone: '', platform: '' });

    toast.success(`ส่งออเดอร์ ${order.queueNumber} เข้าครัวแล้ว`);
    
    // Navigate to bills to handle payment
    setCurrentView('bills');
  };

  // ===== ADDITIONAL HANDLERS =====
  
  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setAppState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      )
    }));
  };

  const addPayment = (orderId: string, payment: Omit<Payment, 'id'>) => {
    const paymentWithId = { ...payment, id: generateId() };
    setAppState(prev => ({
      ...prev,
      orders: prev.orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              payments: [...order.payments, paymentWithId],
              updatedAt: new Date().toISOString()
            }
          : order
      )
    }));
  };

  const updateKDSTicket = (ticketId: string, updates: Partial<KDSTicket>) => {
    setAppState(prev => ({
      ...prev,
      kdsTickets: prev.kdsTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, ...updates }
          : ticket
      )
    }));
    
    // Play notification sound for new tickets
    if (updates.status === 'new') {
      // TODO: Add sound notification
      console.log('🔔 New order alert!');
    }
  };

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  // ===== RENDER FUNCTIONS =====
  
  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#761F1C' }}>
      <div className="flex items-center gap-4">
        <ChefHat className="w-8 h-8 text-white" />
        <div className="text-white">
          <h1 className="text-xl font-bold">{appState.settings.storeName}</h1>
          <div className="flex items-center gap-2 text-sm opacity-90">
            {appState.isOnline ? (
              <><Wifi className="w-4 h-4" /> ออนไลน์</>
            ) : (
              <><WifiOff className="w-4 h-4" /> ออฟไลน์</>
            )}
          </div>
        </div>
      </div>
      
      {appState.currentUser && (
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {appState.currentUser.name} ({appState.currentUser.role.toUpperCase()})
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ChefHat className="w-16 h-16" style={{ color: '#761F1C' }} />
          </div>
          <CardTitle className="text-2xl">{appState.settings.storeName}</CardTitle>
          <p className="text-muted-foreground">กรุณาใส่ PIN เพื่อเข้าสู่ระบบ</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-600">{authError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="ใส่ PIN (4-6 หลัก)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          {showRoleSelect && (
            <div className="space-y-2">
              <label className="text-sm font-medium">เลือกบทบาท:</label>
              {appState.users
                .filter(user => user.pin === pinInput && user.isActive)
                .map(user => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => login(user)}
                  >
                    {user.name} ({user.role.toUpperCase()})
                  </Button>
                ))}
            </div>
          )}

          <Button
            onClick={handlePinSubmit}
            className="w-full"
            style={{ backgroundColor: '#761F1C' }}
            disabled={pinInput.length < 4}
          >
            เข้าสู่ระบบ
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Demo PINs: 1234 (Admin), 1111 (POS), 2222 (KDS)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderType = () => (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">เลือกประเภทออเดอร์</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant={selectedOrderType === 'dine-in' ? 'default' : 'outline'}
            className="h-24 flex-col gap-2"
            onClick={() => setSelectedOrderType('dine-in')}
            style={selectedOrderType === 'dine-in' ? { backgroundColor: '#761F1C' } : {}}
          >
            <Utensils className="w-8 h-8" />
            <span>ทานที่ร้าน</span>
          </Button>
          
          <Button
            variant={selectedOrderType === 'takeaway' ? 'default' : 'outline'}
            className="h-24 flex-col gap-2"
            onClick={() => setSelectedOrderType('takeaway')}
            style={selectedOrderType === 'takeaway' ? { backgroundColor: '#761F1C' } : {}}
          >
            <Package className="w-8 h-8" />
            <span>กลับบ้าน</span>
          </Button>
          
          <Button
            variant={selectedOrderType === 'delivery' ? 'default' : 'outline'}
            className="h-24 flex-col gap-2"
            onClick={() => setSelectedOrderType('delivery')}
            style={selectedOrderType === 'delivery' ? { backgroundColor: '#761F1C' } : {}}
          >
            <MapPin className="w-8 h-8" />
            <span>เดลิเวอรี่</span>
          </Button>
        </div>

        {selectedOrderType === 'dine-in' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">หมายเลขโต๊ะ</label>
              <Input
                placeholder="เช่น A1, B2, 15"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedOrderType === 'delivery' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อลูกค้า</label>
              <Input
                placeholder="ชื่อลูกค้า"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">เบอร์โทรศัพท์</label>
              <Input
                placeholder="08X-XXX-XXXX"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">แพลตฟอร์ม</label>
              <Input
                placeholder="เช่น Grab, FoodPanda, Line Man"
                value={customerInfo.platform}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, platform: e.target.value }))}
              />
            </div>
          </div>
        )}

        {selectedOrderType === 'takeaway' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อลูกค้า (ไม่บังคับ)</label>
              <Input
                placeholder="ชื่อลูกค้า"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
              <Input
                placeholder="08X-XXX-XXXX"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentView('login')}
            className="flex-1"
          >
            ย้อนกลับ
          </Button>
          <Button
            onClick={() => setCurrentView('pos')}
            className="flex-1"
            style={{ backgroundColor: '#761F1C' }}
            disabled={selectedOrderType === 'dine-in' && !tableNumber}
          >
            ดำเนินการต่อ
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPOS = () => {
    const filteredMenu = appState.menu.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && item.available;
    });

    const { subtotal, tax, total } = calculateCartTotal();

    return (
      <div className="flex h-screen">
        {/* Menu Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4 space-y-4">
            <Input
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                style={selectedCategory === 'all' ? { backgroundColor: '#761F1C' } : {}}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={selectedCategory === 'rice' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('rice')}
                style={selectedCategory === 'rice' ? { backgroundColor: '#761F1C' } : {}}
              >
                ข้าวมันไก่
              </Button>
              <Button
                variant={selectedCategory === 'tea' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('tea')}
                style={selectedCategory === 'tea' ? { backgroundColor: '#761F1C' } : {}}
              >
                เครื่องดื่ม
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.map((item) => (
              <Card key={item.sku} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-food.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="text-lg font-bold mb-2" style={{ color: '#761F1C' }}>
                    {formatCurrency(item.price)}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => addToCart(item)}
                    style={{ backgroundColor: '#761F1C' }}
                  >
                    เพิ่ม
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-96 border-l bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <h3 className="font-bold text-lg">ตะกร้าสินค้า</h3>
            <p className="text-sm text-muted-foreground">
              {selectedOrderType === 'dine-in' ? `โต๊ะ ${tableNumber}` : 
               selectedOrderType === 'takeaway' ? 'กลับบ้าน' : 'เดลิเวอรี่'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ตะกร้าว่าง</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    
                    {item.modifiers.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-2">
                        {item.modifiers.map(mod => mod.name).join(', ')}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(index, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(index, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t bg-white p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ยอดรวม</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ภาษี (7%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>รวมทั้งสิ้น</span>
                  <span style={{ color: '#761F1C' }}>{formatCurrency(total)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={submitOrder}
                  className="w-full"
                  style={{ backgroundColor: '#761F1C' }}
                >
                  ส่งเข้าครัว
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentView('order-type')}
                  className="w-full"
                >
                  ย้อนกลับ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render logic
  if (!appState.currentUser && currentView !== 'login') {
    return renderLogin();
  }

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <main className="flex-1">
        {currentView === 'login' && renderLogin()}
        {currentView === 'order-type' && renderOrderType()}
        {currentView === 'pos' && renderPOS()}
        {currentView === 'bills' && (
          <BillsManagement
            orders={appState.orders}
            onUpdateOrder={updateOrder}
            onAddPayment={addPayment}
            formatCurrency={formatCurrency}
            currentUser={appState.currentUser}
          />
        )}
        {currentView === 'kds-kitchen' && (
          <KitchenDisplay
            station="kitchen"
            tickets={appState.kdsTickets}
            onUpdateTicket={updateKDSTicket}
            onPlaySound={() => console.log('🔔 KDS Sound')}
          />
        )}
        {currentView === 'kds-tea' && (
          <KitchenDisplay
            station="tea"
            tickets={appState.kdsTickets}
            onUpdateTicket={updateKDSTicket}
            onPlaySound={() => console.log('🔔 KDS Sound')}
          />
        )}
        {currentView === 'manager' && (
          <ManagerDashboard
            appState={appState}
            onUpdateAppState={updateAppState}
            onExportData={exportData}
            onImportData={importData}
            onSaveToStorage={saveToStorage}
            formatCurrency={formatCurrency}
          />
        )}
      </main>

      {/* Quick Navigation */}
      {appState.currentUser && (
        <div className="fixed bottom-4 right-4 flex gap-2">
          {appState.currentUser.permissions.includes('*') || appState.currentUser.permissions.includes('pos') ? (
            <Button
              onClick={() => setCurrentView('order-type')}
              className="rounded-full w-12 h-12"
              style={{ backgroundColor: '#761F1C' }}
            >
              <ShoppingCart className="w-6 h-6" />
            </Button>
          ) : null}
          
          {appState.currentUser.permissions.includes('*') || appState.currentUser.permissions.includes('bills') ? (
            <Button
              onClick={() => setCurrentView('bills')}
              variant="outline"
              className="rounded-full w-12 h-12"
            >
              <FileText className="w-6 h-6" />
            </Button>
          ) : null}
          
          {appState.currentUser.permissions.includes('*') || appState.currentUser.permissions.includes('kds') ? (
            <>
              <Button
                onClick={() => setCurrentView('kds-kitchen')}
                variant="outline"
                className="rounded-full w-12 h-12"
              >
                <ChefHat className="w-6 h-6" />
              </Button>
              <Button
                onClick={() => setCurrentView('kds-tea')}
                variant="outline"
                className="rounded-full w-12 h-12"
              >
                <Coffee className="w-6 h-6" />
              </Button>
            </>
          ) : null}
          
          {appState.currentUser.permissions.includes('*') ? (
            <Button
              onClick={() => setCurrentView('manager')}
              variant="outline"
              className="rounded-full w-12 h-12"
            >
              <BarChart3 className="w-6 h-6" />
            </Button>
          ) : null}
        </div>
      )}
      
      <Toaster />
    </div>
  );
}