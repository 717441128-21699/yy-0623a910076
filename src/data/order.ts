import { Order, OrderItem } from '@/types';
import { productList } from './product';

const createOrderItem = (productId: string, quantity: number, remark?: string): OrderItem => {
  const product = productList.find(p => p.id === productId)!;
  return {
    productId,
    product,
    quantity,
    unitPrice: product.price,
    subtotal: product.price * quantity,
    remark,
  };
};

export const orderList: Order[] = [
  {
    id: 'o001',
    orderNo: 'DD20260618001',
    status: 'submitted',
    items: [
      createOrderItem('p001', 15, '急用'),
      createOrderItem('p002', 10),
      createOrderItem('p003', 100),
    ],
    totalAmount: 15 * 180 + 10 * 180 + 100 * 12.5,
    totalQuantity: 125,
    supplierId: 's001',
    supplierName: '华东医疗器械有限公司',
    department: '修复科',
    chairNo: '1号椅',
    expectedDate: '2026-06-22',
    createTime: '2026-06-18 09:30:00',
    submitTime: '2026-06-18 10:15:00',
    urgency: 'urgent',
  },
  {
    id: 'o002',
    orderNo: 'DD20260617002',
    status: 'shipped',
    items: [
      createOrderItem('p004', 30),
      createOrderItem('p006', 10),
      createOrderItem('p008', 20),
    ],
    totalAmount: 30 * 35 + 10 * 120 + 20 * 28,
    totalQuantity: 60,
    supplierId: 's003',
    supplierName: '恒康医疗用品',
    department: '综合科',
    expectedDate: '2026-06-21',
    createTime: '2026-06-17 14:20:00',
    submitTime: '2026-06-17 14:50:00',
  },
  {
    id: 'o003',
    orderNo: 'DD20260615003',
    status: 'received',
    items: [
      createOrderItem('p005', 20),
      createOrderItem('p009', 50),
    ],
    totalAmount: 20 * 85 + 50 * 15,
    totalQuantity: 70,
    supplierId: 's001',
    supplierName: '华东医疗器械有限公司',
    department: '修复科',
    chairNo: '2号椅',
    expectedDate: '2026-06-19',
    createTime: '2026-06-15 11:00:00',
    submitTime: '2026-06-15 11:30:00',
    receiveTime: '2026-06-19 10:30:00',
  },
  {
    id: 'o004',
    orderNo: 'DD20260620004',
    status: 'pending',
    items: [
      createOrderItem('p011', 3, '设备更新'),
      createOrderItem('p010', 10),
    ],
    totalAmount: 3 * 1200 + 10 * 150,
    totalQuantity: 13,
    supplierId: 's002',
    supplierName: '康泰医药',
    department: '牙体牙髓科',
    createTime: '2026-06-20 08:45:00',
  },
  {
    id: 'o005',
    orderNo: 'DD20260610005',
    status: 'cancelled',
    items: [
      createOrderItem('p007', 5),
    ],
    totalAmount: 5 * 280,
    totalQuantity: 5,
    supplierId: 's001',
    supplierName: '华东医疗器械有限公司',
    createTime: '2026-06-10 16:00:00',
    remark: '库存盘点后取消',
  },
];

export const getOrderById = (id: string): Order | undefined => {
  return orderList.find(o => o.id === id);
};

export const getOrderByNo = (orderNo: string): Order | undefined => {
  return orderList.find(o => o.orderNo === orderNo);
};

export const getOrdersByStatus = (status: Order['status']): Order[] => {
  return orderList.filter(o => o.status === status);
};
