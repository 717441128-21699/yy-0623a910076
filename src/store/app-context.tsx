import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Order, OrderItem, ReceiveRecord, ReceiveItem } from '@/types';
import { orderList as initialOrders } from '@/data/order';
import { receiveRecordList as initialRecords } from '@/data/receive';
import { productList } from '@/data/product';

interface AppState {
  orders: Order[];
  receiveRecords: ReceiveRecord[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addReceiveRecord: (record: ReceiveRecord) => void;
  updateReceiveRecord: (id: string, updates: Partial<ReceiveRecord>) => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(initialRecords);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const addReceiveRecord = useCallback((record: ReceiveRecord) => {
    setReceiveRecords(prev => [record, ...prev]);
  }, []);

  const updateReceiveRecord = useCallback((id: string, updates: Partial<ReceiveRecord>) => {
    setReceiveRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  return (
    <AppContext.Provider value={{
      orders,
      receiveRecords,
      addOrder,
      updateOrder,
      addReceiveRecord,
      updateReceiveRecord,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return ctx;
};
