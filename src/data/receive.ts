import { ReceiveRecord, ReceiveItem } from '@/types';
import { orderList } from './order';
import { productList } from './product';

const createReceiveItem = (productId: string, expectedQty: number, receivedQty: number, status: ReceiveItem['status']): ReceiveItem => {
  const product = productList.find(p => p.id === productId)!;
  return {
    productId,
    product,
    expectedQty,
    receivedQty,
    status,
  };
};

export const receiveRecordList: ReceiveRecord[] = [
  {
    id: 'r001',
    orderId: orderList[2].id,
    orderNo: orderList[2].orderNo,
    items: [
      createReceiveItem('p005', 20, 20, 'ok'),
      createReceiveItem('p009', 50, 50, 'ok'),
    ],
    totalExpected: 70,
    totalReceived: 70,
    status: 'complete',
    receiveTime: '2026-06-19 10:30:00',
    operator: '张护士长',
  },
  {
    id: 'r002',
    orderId: 'o006',
    orderNo: 'DD20260612006',
    items: [
      createReceiveItem('p001', 10, 8, 'shortage'),
      createReceiveItem('p002', 10, 10, 'ok'),
      createReceiveItem('p004', 20, 22, 'excess'),
    ],
    totalExpected: 40,
    totalReceived: 40,
    status: 'partial',
    receiveTime: '2026-06-18 15:20:00',
    operator: '李库管员',
    remark: '树脂少2支，吸唾管多2袋，已跟供应商确认',
  },
];

export const pendingReceiveOrders = orderList.filter(o => o.status === 'shipped' || o.status === 'submitted');

export const getReceiveRecordById = (id: string): ReceiveRecord | undefined => {
  return receiveRecordList.find(r => r.id === id);
};

export const getReceiveRecordsByStatus = (status: ReceiveRecord['status']): ReceiveRecord[] => {
  return receiveRecordList.filter(r => r.status === status);
};
