export interface Product {
  id: string;
  name: string;
  category: string;
  spec: string;
  brand: string;
  barcode: string;
  unit: string;
  price: number;
  supplierId: string;
  supplierName: string;
  safetyStock: number;
  warnStock: number;
  expiryDate?: string;
  batchNo?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  consumptionRate: number;
  daysRemaining: number;
  lastCountDate: string;
  status: 'ok' | 'warning' | 'danger';
  department?: string;
  chairNo?: string;
}

export interface OrderItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  remark?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: 'pending' | 'submitted' | 'shipped' | 'received' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  totalQuantity: number;
  supplierId: string;
  supplierName: string;
  department?: string;
  chairNo?: string;
  expectedDate?: string;
  createTime: string;
  submitTime?: string;
  receiveTime?: string;
  remark?: string;
  urgency?: 'normal' | 'urgent';
}

export interface ReceiveItem {
  productId: string;
  product: Product;
  expectedQty: number;
  receivedQty: number;
  status: 'ok' | 'shortage' | 'excess' | 'wrong' | 'expiring' | 'pending';
  batchNo?: string;
  expiryDate?: string;
  remark?: string;
}

export interface ReceiveRecord {
  id: string;
  orderId: string;
  orderNo: string;
  items: ReceiveItem[];
  totalExpected: number;
  totalReceived: number;
  status: 'pending' | 'partial' | 'complete';
  receiveTime: string;
  operator: string;
  remark?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  deliveryDays: number;
}

export interface Department {
  id: string;
  name: string;
  chairNos: string[];
}

export type StockStatusType = 'ok' | 'warning' | 'danger';

export interface ScanResult {
  barcode: string;
  product?: Product;
  inventory?: InventoryItem;
}
