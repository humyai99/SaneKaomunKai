import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  Search,
  Filter,
  CreditCard,
  Wallet,
  QrCode,
  Receipt,
  Printer,
  RotateCcw,
  X,
  CheckCircle,
  Clock,
  Package,
  MapPin,
  Utensils,
  DollarSign,
  Calendar,
  User,
  Phone
} from 'lucide-react';

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

interface Modifier {
  id: string;
  name: string;
  price: number;
  category: 'sauce' | 'rice' | 'size' | 'extra';
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

interface BillsManagementProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onAddPayment: (orderId: string, payment: Omit<Payment, 'id'>) => void;
  formatCurrency: (amount: number) => string;
  currentUser: { id: string; name: string } | null;
}

export function BillsManagement({ 
  orders, 
  onUpdateOrder, 
  onAddPayment, 
  formatCurrency,
  currentUser 
}: BillsManagementProps) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [selectedBill, setSelectedBill] = useState<Order | null>(null);
  
  // Payment states
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | 'card' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');

  // Print receipt state
  const [printDialog, setPrintDialog] = useState(false);

  // Generate payment ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    switch (filterDate) {
      case 'today':
        filtered = filtered.filter(order => order.createdAt.startsWith(today));
        break;
      case 'yesterday':
        filtered = filtered.filter(order => order.createdAt.startsWith(yesterday));
        break;
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        filtered = filtered.filter(order => order.createdAt >= weekAgo);
        break;
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(order => order.type === filterType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.queueNumber.toLowerCase().includes(query) ||
        order.tableNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerPhone?.includes(query)
      );
    }

    return filtered;
  }, [orders, searchQuery, filterType, filterDate]);

  // Separate paid and unpaid orders
  const unpaidOrders = filteredOrders.filter(order => 
    order.payments.reduce((sum, p) => sum + p.amount, 0) < order.total
  );
  
  const paidOrders = filteredOrders.filter(order => 
    order.payments.reduce((sum, p) => sum + p.amount, 0) >= order.total
  );

  // Get order type icon
  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in':
        return <Utensils className="w-4 h-4" />;
      case 'takeaway':
        return <Package className="w-4 h-4" />;
      case 'delivery':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="w-4 h-4" />;
      case 'qr':
        return <QrCode className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'transfer':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  // Handle payment submission
  const handlePayment = () => {
    if (!selectedBill || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('กรุณากรอกข้อมูลการชำระเงินให้ครบถ้วน');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const totalPaid = selectedBill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = selectedBill.total - totalPaid;

    if (amount > remaining + 1000) { // Allow overpayment up to 1000 baht for cash
      toast.error('จำนวนเงินเกินกว่าที่ต้องชำระ');
      return;
    }

    const change = paymentMethod === 'cash' && amount > remaining ? amount - remaining : 0;

    const payment: Omit<Payment, 'id'> = {
      method: paymentMethod,
      amount: Math.min(amount, remaining),
      change: change > 0 ? change : undefined,
      reference: paymentReference || undefined,
      paidAt: new Date().toISOString(),
      paidBy: currentUser?.id || 'unknown'
    };

    onAddPayment(selectedBill.id, payment);

    // Update order status if fully paid
    if (totalPaid + payment.amount >= selectedBill.total) {
      onUpdateOrder(selectedBill.id, { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
    }

    // Reset payment form
    setPaymentAmount('');
    setPaymentReference('');
    setPaymentDialog(false);
    
    toast.success('บันทึกการชำระเงินแล้ว');
  };

  // Handle refund
  const handleRefund = (order: Order) => {
    if (window.confirm(`ต้องการคืนเงินสำหรับออเดอร์ #${order.queueNumber} หรือไม่?`)) {
      onUpdateOrder(order.id, { 
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        notes: (order.notes || '') + ` [คืนเงิน ${new Date().toLocaleString('th-TH')}]`
      });
      toast.success('คืนเงินแล้ว');
    }
  };

  // Handle void order
  const handleVoid = (order: Order) => {
    if (window.confirm(`ต้องการยกเลิกออเดอร์ #${order.queueNumber} หรือไม่?`)) {
      onUpdateOrder(order.id, { 
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        notes: (order.notes || '') + ` [ยกเลิก ${new Date().toLocaleString('th-TH')}]`
      });
      toast.success('ยกเลิกออเดอร์แล้ว');
    }
  };

  // Print receipt
  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt #${order.queueNumber}</title>
          <style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 10px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .line { border-bottom: 1px dashed #000; margin: 5px 0; }
            .bold { font-weight: bold; }
            .item { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">เสน่ห์ข้าวมันไก่</div>
          <div class="center">123 ถนนสุขุมวิท กรุงเทพฯ 10110</div>
          <div class="center">โทร: 02-123-4567</div>
          <div class="line"></div>
          
          <div>ออเดอร์: #${order.queueNumber}</div>
          <div>วันที่: ${new Date(order.createdAt).toLocaleDateString('th-TH')}</div>
          <div>เวลา: ${new Date(order.createdAt).toLocaleTimeString('th-TH')}</div>
          <div>ประเภท: ${order.type === 'dine-in' ? `ทานที่ร้าน (โต๊ะ ${order.tableNumber})` : 
                       order.type === 'takeaway' ? 'กลับบ้าน' : 'เดลิเวอรี่'}</div>
          ${order.customerName ? `<div>ลูกค้า: ${order.customerName}</div>` : ''}
          
          <div class="line"></div>
          
          ${order.items.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
            ${item.modifiers.length > 0 ? `<div style="margin-left: 20px; font-size: 12px;">+ ${item.modifiers.map(m => m.name).join(', ')}</div>` : ''}
          `).join('')}
          
          <div class="line"></div>
          
          <div class="item">
            <span>ยอดรวม</span>
            <span>${formatCurrency(order.subtotal)}</span>
          </div>
          <div class="item">
            <span>ภาษี</span>
            <span>${formatCurrency(order.tax)}</span>
          </div>
          <div class="item bold">
            <span>รวมทั้งสิ้น</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
          
          ${order.payments.length > 0 ? `
            <div class="line"></div>
            ${order.payments.map(payment => `
              <div class="item">
                <span>${payment.method === 'cash' ? 'เงินสด' : 
                       payment.method === 'qr' ? 'QR Code' : 
                       payment.method === 'card' ? 'บัตร' : 'โอน'}</span>
                <span>${formatCurrency(payment.amount)}</span>
              </div>
              ${payment.change ? `<div class="item"><span>เงินทอน</span><span>${formatCurrency(payment.change)}</span></div>` : ''}
            `).join('')}
          ` : ''}
          
          <div class="line"></div>
          <div class="center">ขอบคุณที่ใช้บริการ</div>
          <div class="center">โดย: ${currentUser?.name || 'Staff'}</div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Render order card
  const renderOrderCard = (order: Order, isPaid: boolean = false) => {
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = order.total - totalPaid;
    const isFullyPaid = remaining <= 0;

    return (
      <Card key={order.id} className={`mb-4 ${!isPaid && remaining > 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                #{order.queueNumber}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getOrderTypeIcon(order.type)}
                <span className="text-sm text-muted-foreground">
                  {order.type === 'dine-in' ? `โต๊ะ ${order.tableNumber}` : 
                   order.type === 'takeaway' ? 'กลับบ้าน' : 'เดลิเวอรี่'}
                </span>
                {order.customerName && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="text-sm">{order.customerName}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span className="text-sm">{order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg" style={{ color: '#761F1C' }}>
                {formatCurrency(order.total)}
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleTimeString('th-TH')}
              </div>
              {!isPaid && remaining > 0 && (
                <Badge variant="destructive" className="mt-1">
                  ค้างชำระ {formatCurrency(remaining)}
                </Badge>
              )}
              {isFullyPaid && (
                <Badge className="mt-1 bg-green-600">
                  ชำระแล้ว
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Items Summary */}
          <div className="space-y-1 mb-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Payments */}
          {order.payments.length > 0 && (
            <div className="border-t pt-3 mb-4">
              <div className="text-sm font-medium mb-2">การชำระเงิน:</div>
              {order.payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center text-sm mb-1">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(payment.method)}
                    <span>
                      {payment.method === 'cash' ? 'เงินสด' : 
                       payment.method === 'qr' ? 'QR Code' : 
                       payment.method === 'card' ? 'บัตร' : 'โอน'}
                    </span>
                    {payment.reference && (
                      <span className="text-muted-foreground">({payment.reference})</span>
                    )}
                  </div>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              ))}
              {order.payments.some(p => p.change) && (
                <div className="text-sm text-muted-foreground">
                  เงินทอน: {formatCurrency(order.payments.find(p => p.change)?.change || 0)}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isPaid && remaining > 0 && (
              <Button
                onClick={() => {
                  setSelectedBill(order);
                  setPaymentAmount(remaining.toString());
                  setPaymentDialog(true);
                }}
                size="sm"
                style={{ backgroundColor: '#761F1C' }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                ชำระเงิน
              </Button>
            )}

            <Button
              onClick={() => printReceipt(order)}
              variant="outline"
              size="sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์
            </Button>

            {isPaid && (
              <Button
                onClick={() => handleRefund(order)}
                variant="outline"
                size="sm"
                className="text-orange-600 hover:text-orange-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                คืนเงิน
              </Button>
            )}

            <Button
              onClick={() => handleVoid(order)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">จัดการบิล</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              ค้างชำระ: {unpaidOrders.length}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-600">
              ชำระแล้ว: {paidOrders.length}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาเลขคิว, โต๊ะ, ชื่อ, เบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="ประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="dine-in">ทานที่ร้าน</SelectItem>
              <SelectItem value="takeaway">กลับบ้าน</SelectItem>
              <SelectItem value="delivery">เดลิเวอรี่</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="วันที่" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="yesterday">เมื่อวาน</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="all">ทั้งหมด</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="unpaid" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 m-4 mb-0">
            <TabsTrigger value="unpaid" className="relative">
              ค้างชำระ
              {unpaidOrders.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs min-w-[20px] h-5">
                  {unpaidOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid">
              ชำระแล้ว
              {paidOrders.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs min-w-[20px] h-5">
                  {paidOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="unpaid" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {unpaidOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีบิลค้างชำระ</p>
                  </div>
                ) : (
                  unpaidOrders
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map(order => renderOrderCard(order, false))
                )}
              </div>
            </TabsContent>

            <TabsContent value="paid" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {paidOrders.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ยังไม่มีบิลที่ชำระแล้ว</p>
                  </div>
                ) : (
                  paidOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(order => renderOrderCard(order, true))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ชำระเงิน #{selectedBill?.queueNumber}</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลการชำระเงินสำหรับออเดอร์นี้
            </DialogDescription>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex justify-between text-sm mb-2">
                  <span>ยอดรวม:</span>
                  <span>{formatCurrency(selectedBill.total)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>ชำระแล้ว:</span>
                  <span>{formatCurrency(selectedBill.payments.reduce((sum, p) => sum + p.amount, 0))}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>คงเหลือ:</span>
                  <span style={{ color: '#761F1C' }}>
                    {formatCurrency(selectedBill.total - selectedBill.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method">วิธีชำระเงิน</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">เงินสด</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="card">บัตรเครดิต/เดบิต</SelectItem>
                      <SelectItem value="transfer">โอนเงิน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment-amount">จำนวนเงิน</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                {(paymentMethod === 'qr' || paymentMethod === 'card' || paymentMethod === 'transfer') && (
                  <div>
                    <Label htmlFor="payment-reference">หมายเลขอ้างอิง (ไม่บังคับ)</Label>
                    <Input
                      id="payment-reference"
                      placeholder="เลขที่ใบเสร็จ, Transaction ID, ฯลฯ"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                )}

                {paymentMethod === 'cash' && paymentAmount && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm">
                      <div>รับเงิน: {formatCurrency(parseFloat(paymentAmount) || 0)}</div>
                      <div>เงินทอน: {formatCurrency(Math.max(0, (parseFloat(paymentAmount) || 0) - (selectedBill.total - selectedBill.payments.reduce((sum, p) => sum + p.amount, 0))))}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialog(false)}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handlePayment}
                  className="flex-1"
                  style={{ backgroundColor: '#761F1C' }}
                >
                  ยืนยันการชำระ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}