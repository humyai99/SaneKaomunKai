import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Package,
  Download,
  Upload,
  Settings,
  FileText,
  Calendar,
  Filter,
  ChefHat,
  Coffee,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Order {
  id: string;
  queueNumber: string;
  type: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  payments: Payment[];
}

interface OrderItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: Modifier[];
  station: string;
  category: string;
}

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
}

interface Payment {
  id: string;
  method: string;
  amount: number;
  paidAt: string;
}

interface KDSTicket {
  id: string;
  station: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  slaMinutes: number;
}

interface AppState {
  orders: Order[];
  menu: MenuItem[];
  kdsTickets: KDSTicket[];
  settings: any;
}

interface ManagerDashboardProps {
  appState: AppState;
  onUpdateAppState: (updates: Partial<AppState>) => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveToStorage: () => void;
  formatCurrency: (amount: number) => string;
}

export function ManagerDashboard({
  appState,
  onUpdateAppState,
  onExportData,
  onImportData,
  onSaveToStorage,
  formatCurrency
}: ManagerDashboardProps) {
  // Report filters
  const [reportDateFrom, setReportDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [reportDateTo, setReportDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'sales' | 'items' | 'kds'>('sales');

  // Menu management
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [menuForm, setMenuForm] = useState<Partial<MenuItem>>({});

  // Settings
  const [settingsForm, setSettingsForm] = useState(appState.settings);

  // Generate reports data
  const reportsData = useMemo(() => {
    const startDate = new Date(reportDateFrom);
    const endDate = new Date(reportDateTo + 'T23:59:59');
    
    const filteredOrders = appState.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const filteredTickets = appState.kdsTickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      return ticketDate >= startDate && ticketDate <= endDate;
    });

    // Sales metrics
    const totalRevenue = filteredOrders
      .filter(order => order.payments.length > 0)
      .reduce((sum, order) => sum + order.total, 0);
    
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const paidOrders = filteredOrders.filter(order => 
      order.payments.reduce((sum, p) => sum + p.amount, 0) >= order.total
    );
    
    // Payment methods breakdown
    const paymentMethods = filteredOrders
      .flatMap(order => order.payments)
      .reduce((acc, payment) => {
        acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);

    // Order types breakdown
    const orderTypes = filteredOrders.reduce((acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top selling items
    const itemSales = filteredOrders
      .flatMap(order => order.items)
      .reduce((acc, item) => {
        const key = item.name;
        if (!acc[key]) {
          acc[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;
        return acc;
      }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // KDS performance
    const completedTickets = filteredTickets.filter(ticket => ticket.readyAt);
    const avgCookTime = completedTickets.length > 0 
      ? completedTickets.reduce((sum, ticket) => {
          const start = new Date(ticket.startedAt || ticket.createdAt);
          const end = new Date(ticket.readyAt!);
          return sum + (end.getTime() - start.getTime()) / 1000 / 60;
        }, 0) / completedTickets.length
      : 0;

    const slaBreaches = completedTickets.filter(ticket => {
      const start = new Date(ticket.startedAt || ticket.createdAt);
      const end = new Date(ticket.readyAt!);
      const cookTime = (end.getTime() - start.getTime()) / 1000 / 60;
      return cookTime > ticket.slaMinutes;
    }).length;

    const slaPerformance = completedTickets.length > 0 
      ? ((completedTickets.length - slaBreaches) / completedTickets.length) * 100
      : 100;

    // Hourly sales for today
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = appState.orders.filter(order => 
      order.createdAt.startsWith(today) && order.payments.length > 0
    );
    
    const hourlySales = Array.from({ length: 24 }, (_, hour) => {
      const orderCount = todayOrders.filter(order => {
        const orderHour = new Date(order.createdAt).getHours();
        return orderHour === hour;
      }).length;
      
      const revenue = todayOrders
        .filter(order => new Date(order.createdAt).getHours() === hour)
        .reduce((sum, order) => sum + order.total, 0);
      
      return { hour, orderCount, revenue };
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      paidOrders: paidOrders.length,
      paymentMethods,
      orderTypes,
      topItems,
      avgCookTime,
      slaPerformance,
      slaBreaches,
      completedTickets: completedTickets.length,
      hourlySales
    };
  }, [appState.orders, appState.kdsTickets, reportDateFrom, reportDateTo]);

  // Export CSV report
  const exportCSVReport = () => {
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'sales':
        csvContent = `วันที่,เลขคิว,ประเภท,ยอดรวม,สถานะ,วิธีชำระ\n`;
        const salesOrders = appState.orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          const startDate = new Date(reportDateFrom);
          const endDate = new Date(reportDateTo + 'T23:59:59');
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        salesOrders.forEach(order => {
          const paymentMethod = order.payments.map(p => p.method).join(', ') || 'ยังไม่ชำระ';
          csvContent += `${order.createdAt.split('T')[0]},${order.queueNumber},${order.type},${order.total},${order.status},${paymentMethod}\n`;
        });
        filename = `sales-report-${reportDateFrom}-to-${reportDateTo}.csv`;
        break;
        
      case 'items':
        csvContent = `เมนู,จำนวนขาย,ยอดขาย\n`;
        reportsData.topItems.forEach(item => {
          csvContent += `${item.name},${item.quantity},${item.revenue}\n`;
        });
        filename = `items-report-${reportDateFrom}-to-${reportDateTo}.csv`;
        break;
        
      case 'kds':
        csvContent = `วันที่,สถานี,สถานะ,เวลาปรุง(นาที),SLA(นาที),เกินSLA\n`;
        const kdsTickets = appState.kdsTickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt);
          const startDate = new Date(reportDateFrom);
          const endDate = new Date(reportDateTo + 'T23:59:59');
          return ticketDate >= startDate && ticketDate <= endDate && ticket.readyAt;
        });
        
        kdsTickets.forEach(ticket => {
          const start = new Date(ticket.startedAt || ticket.createdAt);
          const end = new Date(ticket.readyAt!);
          const cookTime = (end.getTime() - start.getTime()) / 1000 / 60;
          const isOverSLA = cookTime > ticket.slaMinutes;
          
          csvContent += `${ticket.createdAt.split('T')[0]},${ticket.station},${ticket.status},${cookTime.toFixed(1)},${ticket.slaMinutes},${isOverSLA ? 'ใช่' : 'ไม่'}\n`;
        });
        filename = `kds-report-${reportDateFrom}-to-${reportDateTo}.csv`;
        break;
    }

    // Download CSV
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('ส่งออกรายงานสำเร็จ');
  };

  // Menu management functions
  const handleMenuSave = () => {
    if (!menuForm.name || !menuForm.price || !menuForm.category || !menuForm.station) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (editingMenuItem) {
      // Update existing item
      const updatedMenu = appState.menu.map(item => 
        item.sku === editingMenuItem.sku 
          ? { ...item, ...menuForm }
          : item
      );
      onUpdateAppState({ menu: updatedMenu });
      toast.success('อัพเดทเมนูสำเร็จ');
    } else {
      // Add new item
      const newSKU = `${menuForm.category?.toUpperCase()}${String(appState.menu.length + 1).padStart(3, '0')}`;
      const newItem: MenuItem = {
        ...menuForm as MenuItem,
        sku: newSKU,
        available: true,
        modifiers: menuForm.modifiers || []
      };
      onUpdateAppState({ menu: [...appState.menu, newItem] });
      toast.success('เพิ่มเมนูสำเร็จ');
    }

    setShowMenuDialog(false);
    setEditingMenuItem(null);
    setMenuForm({});
  };

  const handleMenuDelete = (sku: string) => {
    if (window.confirm('ต้องการลบเมนูนี้หรือไม่?')) {
      const updatedMenu = appState.menu.filter(item => item.sku !== sku);
      onUpdateAppState({ menu: updatedMenu });
      toast.success('ลบเมนูสำเร็จ');
    }
  };

  const toggleMenuAvailability = (sku: string) => {
    const updatedMenu = appState.menu.map(item => 
      item.sku === sku 
        ? { ...item, available: !item.available }
        : item
    );
    onUpdateAppState({ menu: updatedMenu });
    toast.success('อัพเดทสถานะเมนูสำเร็จ');
  };

  // Settings save
  const handleSettingsSave = () => {
    onUpdateAppState({ settings: settingsForm });
    onSaveToStorage();
    toast.success('บันทึกการตั้งค่าสำเร็จ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">หน้าจัดการระบบ</h1>
          <div className="flex gap-2">
            <Button onClick={onSaveToStorage} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              บันทึกข้อมูล
            </Button>
            <Button onClick={onExportData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              ส่งออก JSON
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={onImportData}
                className="hidden"
                id="import-file"
              />
              <Button asChild variant="outline">
                <label htmlFor="import-file" className="cursor-pointer flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  นำเข้า JSON
                </label>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">แดชบอร์ด</TabsTrigger>
            <TabsTrigger value="reports">รายงาน</TabsTrigger>
            <TabsTrigger value="menu">จัดการเมนู</TabsTrigger>
            <TabsTrigger value="settings">ตั้งค่า</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ยอดขายวันนี้</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#761F1C' }}>
                    {formatCurrency(
                      appState.orders
                        .filter(order => 
                          order.createdAt.startsWith(new Date().toISOString().split('T')[0]) &&
                          order.payments.length > 0
                        )
                        .reduce((sum, order) => sum + order.total, 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% จากเมื่อวาน
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ออเดอร์วันนี้</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {appState.orders.filter(order => 
                      order.createdAt.startsWith(new Date().toISOString().split('T')[0])
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {appState.orders.filter(order => 
                      order.createdAt.startsWith(new Date().toISOString().split('T')[0]) &&
                      order.payments.reduce((sum, p) => sum + p.amount, 0) < order.total
                    ).length} ออเดอร์ค้างชำระ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">เวลาปรุงเฉลี่ย</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportsData.avgCookTime.toFixed(1)} นาที
                  </div>
                  <p className="text-xs text-muted-foreground">
                    SLA: {appState.settings.kdsSlaMinutes} นาที
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SLA Performance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportsData.slaPerformance.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportsData.slaBreaches} ครั้งเกิน SLA
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ยอดขายรายชั่วโมง (วันนี้)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportsData.hourlySales
                      .filter(h => h.orderCount > 0)
                      .slice(-6)
                      .map(hour => (
                        <div key={hour.hour} className="flex items-center justify-between">
                          <span className="text-sm">{hour.hour}:00 - {hour.hour + 1}:00</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(hour.revenue)}</div>
                            <div className="text-xs text-muted-foreground">{hour.orderCount} ออเดอร์</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>เมนูขายดี (วันนี้)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportsData.topItems.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.revenue)}</div>
                          <div className="text-xs text-muted-foreground">{item.quantity} ชิ้น</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>รายงานและสถิติ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range Filter */}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <Label htmlFor="date-from">จากวันที่</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={reportDateFrom}
                      onChange={(e) => setReportDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to">ถึงวันที่</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={reportDateTo}
                      onChange={(e) => setReportDateTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-type">ประเภทรายงาน</Label>
                    <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">ยอดขาย</SelectItem>
                        <SelectItem value="items">เมนูขายดี</SelectItem>
                        <SelectItem value="kds">ประสิทธิภาพครัว</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={exportCSVReport}>
                      <Download className="w-4 h-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </div>

                {/* Report Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#761F1C' }}>
                      {formatCurrency(reportsData.totalRevenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">ยอดขายรวม</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{reportsData.totalOrders}</div>
                    <div className="text-sm text-muted-foreground">ออเดอร์ทั้งหมด</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(reportsData.avgOrderValue)}
                    </div>
                    <div className="text-sm text-muted-foreground">ค่าเฉลี่ยต่อออเดอร์</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>จัดการเมนู</CardTitle>
                <Button 
                  onClick={() => {
                    setEditingMenuItem(null);
                    setMenuForm({});
                    setShowMenuDialog(true);
                  }}
                  style={{ backgroundColor: '#761F1C' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มเมนูใหม่
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appState.menu.map((item) => (
                    <Card key={item.sku} className={`${!item.available ? 'opacity-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.sku}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleMenuAvailability(item.sku)}
                            >
                              {item.available ? 
                                <Eye className="w-4 h-4 text-green-600" /> : 
                                <EyeOff className="w-4 h-4 text-red-600" />
                              }
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMenuItem(item);
                                setMenuForm(item);
                                setShowMenuDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMenuDelete(item.sku)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>ราคา:</span>
                            <span className="font-medium">{formatCurrency(item.price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>หมวดหมู่:</span>
                            <span>{item.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>สถานี:</span>
                            <span>{item.station === 'kitchen' ? 'ครัว' : 'เครื่องดื่ม'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>สถานะ:</span>
                            <Badge variant={item.available ? 'default' : 'secondary'}>
                              {item.available ? 'เปิดขาย' : 'ปิดขาย'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>การตั้งค่าระบบ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-name">ชื่อร้าน</Label>
                    <Input
                      id="store-name"
                      value={settingsForm.storeName}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-phone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="store-phone"
                      value={settingsForm.storePhone}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storePhone: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="store-address">ที่อยู่</Label>
                    <Textarea
                      id="store-address"
                      value={settingsForm.storeAddress}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, storeAddress: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-rate">อัตราภาษี (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={settingsForm.taxRate * 100}
                      onChange={(e) => setSettingsForm(prev => ({ 
                        ...prev, 
                        taxRate: parseFloat(e.target.value) / 100 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="kds-sla">SLA ครัว (นาที)</Label>
                    <Input
                      id="kds-sla"
                      type="number"
                      min="1"
                      max="60"
                      value={settingsForm.kdsSlaMinutes}
                      onChange={(e) => setSettingsForm(prev => ({ 
                        ...prev, 
                        kdsSlaMinutes: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={handleSettingsSave} style={{ backgroundColor: '#761F1C' }}>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึกการตั้งค่า
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Menu Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
            </DialogTitle>
            <DialogDescription>
              {editingMenuItem ? 'แก้ไขข้อมูลเมนูที่เลือก' : 'เพิ่มเมนูใหม่ลงในระบบ'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="menu-name">ชื่อเมนู</Label>
              <Input
                id="menu-name"
                value={menuForm.name || ''}
                onChange={(e) => setMenuForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="menu-price">ราคา</Label>
              <Input
                id="menu-price"
                type="number"
                step="0.01"
                min="0"
                value={menuForm.price || ''}
                onChange={(e) => setMenuForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="menu-category">หมวดหมู่</Label>
              <Select 
                value={menuForm.category} 
                onValueChange={(value: any) => setMenuForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rice">ข้าวมันไก่</SelectItem>
                  <SelectItem value="tea">เครื่องดื่ม</SelectItem>
                  <SelectItem value="side">เครื่องเคียง</SelectItem>
                  <SelectItem value="dessert">ของหวาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="menu-station">สถานี</Label>
              <Select 
                value={menuForm.station} 
                onValueChange={(value: any) => setMenuForm(prev => ({ ...prev, station: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานี" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">ครัว</SelectItem>
                  <SelectItem value="tea">เครื่องดื่ม</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="menu-image">URL รูปภาพ</Label>
              <Input
                id="menu-image"
                placeholder="https://example.com/image.jpg"
                value={menuForm.imageUrl || ''}
                onChange={(e) => setMenuForm(prev => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMenuDialog(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleMenuSave}
                className="flex-1"
                style={{ backgroundColor: '#761F1C' }}
              >
                {editingMenuItem ? 'อัพเดท' : 'เพิ่ม'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}