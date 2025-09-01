import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Users,
  Utensils,
  Coffee,
  Package,
  MapPin
} from 'lucide-react';

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
  required?: boolean;
}

interface KitchenDisplayProps {
  station: 'kitchen' | 'tea';
  tickets: KDSTicket[];
  onUpdateTicket: (ticketId: string, updates: Partial<KDSTicket>) => void;
  onPlaySound?: () => void;
}

export function KitchenDisplay({ station, tickets, onUpdateTicket, onPlaySound }: KitchenDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter tickets for this station
  const stationTickets = tickets.filter(ticket => ticket.station === station);
  
  // Group tickets by status
  const newTickets = stationTickets.filter(t => t.status === 'new');
  const inProgressTickets = stationTickets.filter(t => t.status === 'in-progress');
  const readyTickets = stationTickets.filter(t => t.status === 'ready');

  // Calculate elapsed time
  const getElapsedTime = (ticket: KDSTicket): number => {
    const startTime = ticket.startedAt ? new Date(ticket.startedAt) : new Date(ticket.createdAt);
    return Math.floor((currentTime.getTime() - startTime.getTime()) / 1000 / 60);
  };

  // Check if ticket is over SLA
  const isOverSLA = (ticket: KDSTicket): boolean => {
    return getElapsedTime(ticket) > ticket.slaMinutes;
  };

  // Get time color based on SLA
  const getTimeColor = (ticket: KDSTicket): string => {
    const elapsed = getElapsedTime(ticket);
    const ratio = elapsed / ticket.slaMinutes;
    
    if (ratio >= 1) return 'text-red-600'; // Over SLA
    if (ratio >= 0.8) return 'text-orange-600'; // Warning
    return 'text-green-600'; // Good
  };

  // Format time display
  const formatElapsedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle ticket status updates
  const handleStartTicket = (ticket: KDSTicket) => {
    onUpdateTicket(ticket.id, {
      status: 'in-progress',
      startedAt: new Date().toISOString()
    });
  };

  const handleCompleteTicket = (ticket: KDSTicket) => {
    onUpdateTicket(ticket.id, {
      status: 'ready',
      readyAt: new Date().toISOString()
    });
  };

  const handleCloseTicket = (ticket: KDSTicket) => {
    onUpdateTicket(ticket.id, {
      status: 'closed',
      closedAt: new Date().toISOString()
    });
  };

  // Get order type icon
  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
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

  // Get priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      default: return 'bg-blue-600';
    }
  };

  // Render ticket card
  const renderTicket = (ticket: KDSTicket) => {
    const elapsedTime = getElapsedTime(ticket);
    const timeColor = getTimeColor(ticket);
    const isOverdue = isOverSLA(ticket);

    return (
      <Card key={ticket.id} className={`${isOverdue ? 'border-red-500 bg-red-50' : ''} mb-4`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">
                #{ticket.queueNumber}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getOrderTypeIcon(ticket.orderType)}
                <span className="text-sm text-muted-foreground">
                  {ticket.orderType === 'dine-in' ? `โต๊ะ ${ticket.tableNumber}` : 
                   ticket.orderType === 'takeaway' ? 'กลับบ้าน' : 'เดลิเวอรี่'}
                </span>
                {ticket.priority !== 'normal' && (
                  <Badge className={`text-white text-xs ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority === 'urgent' ? 'ด่วนมาก' : 'ด่วน'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm font-medium ${timeColor}`}>
                <Clock className="w-4 h-4" />
                <span>{formatElapsedTime(elapsedTime)}</span>
                {isOverdue && <AlertTriangle className="w-4 h-4 text-red-600" />}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                SLA: {ticket.slaMinutes}m
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Items */}
            <div className="space-y-2">
              {ticket.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.quantity}x {item.name}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.modifiers.map(mod => mod.name).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-sm text-orange-600 mt-1 font-medium">
                        หมายเหตุ: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {ticket.notes && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm font-medium text-yellow-800">หมายเหตุ:</div>
                <div className="text-sm text-yellow-700">{ticket.notes}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {ticket.status === 'new' && (
                <Button
                  onClick={() => handleStartTicket(ticket)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  เริ่มทำ
                </Button>
              )}
              
              {ticket.status === 'in-progress' && (
                <Button
                  onClick={() => handleCompleteTicket(ticket)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  เสร็จแล้ว
                </Button>
              )}
              
              {ticket.status === 'ready' && (
                <Button
                  onClick={() => handleCloseTicket(ticket)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ส่งแล้ว
                </Button>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground border-t pt-2">
              <div>สั่ง: {new Date(ticket.createdAt).toLocaleTimeString('th-TH')}</div>
              {ticket.startedAt && (
                <div>เริ่ม: {new Date(ticket.startedAt).toLocaleTimeString('th-TH')}</div>
              )}
              {ticket.readyAt && (
                <div>เสร็จ: {new Date(ticket.readyAt).toLocaleTimeString('th-TH')}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const stationName = station === 'kitchen' ? 'ครัว' : 'เครื่องดื่ม';
  const stationIcon = station === 'kitchen' ? <Utensils className="w-6 h-6" /> : <Coffee className="w-6 h-6" />;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stationIcon}
            <h1 className="text-2xl font-bold">KDS - {stationName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleTimeString('th-TH')}
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{newTickets.length}</div>
                <div className="text-xs text-muted-foreground">ใหม่</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressTickets.length}</div>
                <div className="text-xs text-muted-foreground">กำลังทำ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{readyTickets.length}</div>
                <div className="text-xs text-muted-foreground">เสร็จแล้ว</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="new" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
            <TabsTrigger value="new" className="relative">
              ใหม่
              {newTickets.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs min-w-[20px] h-5">
                  {newTickets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="relative">
              กำลังทำ
              {inProgressTickets.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs min-w-[20px] h-5">
                  {inProgressTickets.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              เสร็จแล้ว
              {readyTickets.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs min-w-[20px] h-5">
                  {readyTickets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {newTickets.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Timer className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีออเดอร์ใหม่</p>
                  </div>
                ) : (
                  newTickets
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map(renderTicket)
                )}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inProgressTickets.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีออเดอร์ที่กำลังทำ</p>
                  </div>
                ) : (
                  inProgressTickets
                    .sort((a, b) => new Date(a.startedAt!).getTime() - new Date(b.startedAt!).getTime())
                    .map(renderTicket)
                )}
              </div>
            </TabsContent>

            <TabsContent value="ready" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {readyTickets.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่มีออเดอร์ที่เสร็จแล้ว</p>
                  </div>
                ) : (
                  readyTickets
                    .sort((a, b) => new Date(a.readyAt!).getTime() - new Date(b.readyAt!).getTime())
                    .map(renderTicket)
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}