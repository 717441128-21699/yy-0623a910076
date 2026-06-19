import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Order, OrderItem, ReceiveRecord, ReceiveItem, ReceiveSession } from '@/types';
import { orderList as initialOrders } from '@/data/order';
import { receiveRecordList as initialRecords } from '@/data/receive';
import { productList } from '@/data/product';

const STORAGE_KEY_ORDERS = 'dental_orders';
const STORAGE_KEY_RECORDS = 'dental_receive_records';
const STORAGE_KEY_SESSION = 'dental_receive_session';

interface AppState {
  orders: Order[];
  receiveRecords: ReceiveRecord[];
  currentReceiveSession: ReceiveSession | null;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addReceiveRecord: (record: ReceiveRecord) => void;
  updateReceiveRecord: (id: string, updates: Partial<ReceiveRecord>) => void;
  startReceiveSession: (orderId: string, items: ReceiveItem[]) => void;
  updateReceiveSessionItem: (productId: string, updates: Partial<ReceiveItem>) => void;
  addWrongItemToSession: (item: ReceiveItem) => void;
  incrementReceiveQty: (productId: string, amount?: number) => void;
  clearReceiveSession: () => void;
}

const AppContext = createContext<AppState | null>(null);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from storage:`, e);
  }
  return fallback;
};

const saveToStorage = <T,>(key: string, data: T) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to storage:`, e);
  }
};

const getTimestamp = () => new Date().toISOString();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage(STORAGE_KEY_ORDERS, initialOrders));
  const [receiveRecords, setReceiveRecords] = useState<ReceiveRecord[]>(() => loadFromStorage(STORAGE_KEY_RECORDS, initialRecords));
  const [currentReceiveSession, setCurrentReceiveSession] = useState<ReceiveSession | null>(() => loadFromStorage(STORAGE_KEY_SESSION, null));

  useEffect(() => {
    saveToStorage(STORAGE_KEY_ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_RECORDS, receiveRecords);
  }, [receiveRecords]);

  useEffect(() => {
    if (currentReceiveSession) {
      saveToStorage(STORAGE_KEY_SESSION, currentReceiveSession);
    } else {
      try {
        Taro.removeStorageSync(STORAGE_KEY_SESSION);
      } catch (e) {
        console.warn('Failed to remove session from storage:', e);
      }
    }
  }, [currentReceiveSession]);

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

  const startReceiveSession = useCallback((orderId: string, items: ReceiveItem[]) => {
    const now = getTimestamp();
    const session: ReceiveSession = {
      orderId,
      items: items.map(item => ({ ...item })),
      wrongItems: [],
      createdAt: now,
      updatedAt: now,
    };
    setCurrentReceiveSession(session);
  }, []);

  const updateReceiveSessionItem = useCallback((productId: string, updates: Partial<ReceiveItem>) => {
    setCurrentReceiveSession(prev => {
      if (!prev) return prev;

      let itemIndex = prev.items.findIndex(i => i.productId === productId);
      let targetArray = 'items' as 'items' | 'wrongItems';

      if (itemIndex === -1) {
        itemIndex = prev.wrongItems.findIndex(i => i.productId === productId);
        targetArray = 'wrongItems';
      }

      if (itemIndex === -1) return prev;

      const newArray = [...prev[targetArray]];
      newArray[itemIndex] = {
        ...newArray[itemIndex],
        ...updates,
      };

      return {
        ...prev,
        [targetArray]: newArray,
        updatedAt: getTimestamp(),
      };
    });
  }, []);

  const addWrongItemToSession = useCallback((item: ReceiveItem) => {
    setCurrentReceiveSession(prev => {
      if (!prev) return prev;

      const existingIndex = prev.wrongItems.findIndex(i => i.productId === item.productId);
      let newWrongItems;

      if (existingIndex >= 0) {
        newWrongItems = [...prev.wrongItems];
        newWrongItems[existingIndex] = {
          ...newWrongItems[existingIndex],
          receivedQty: newWrongItems[existingIndex].receivedQty + item.receivedQty,
        };
      } else {
        newWrongItems = [...prev.wrongItems, item];
      }

      return {
        ...prev,
        wrongItems: newWrongItems,
        updatedAt: getTimestamp(),
      };
    });
  }, []);

  const incrementReceiveQty = useCallback((productId: string, amount: number = 1) => {
    setCurrentReceiveSession(prev => {
      if (!prev) return prev;

      const itemIndex = prev.items.findIndex(i => i.productId === productId);
      if (itemIndex === -1) return prev;

      const newItems = [...prev.items];
      const item = { ...newItems[itemIndex] };
      const newQty = item.receivedQty + amount;
      item.receivedQty = newQty;

      if (newQty === 0) {
        item.status = 'pending';
      } else if (newQty === item.expectedQty) {
        item.status = 'ok';
      } else if (newQty < item.expectedQty) {
        if (item.status !== 'expiring' && item.status !== 'wrong') {
          item.status = 'shortage';
        }
      } else {
        if (item.status !== 'expiring' && item.status !== 'wrong') {
          item.status = 'excess';
        }
      }

      newItems[itemIndex] = item;

      return {
        ...prev,
        items: newItems,
        updatedAt: getTimestamp(),
      };
    });
  }, []);

  const clearReceiveSession = useCallback(() => {
    setCurrentReceiveSession(null);
  }, []);

  return (
    <AppContext.Provider value={{
      orders,
      receiveRecords,
      currentReceiveSession,
      addOrder,
      updateOrder,
      addReceiveRecord,
      updateReceiveRecord,
      startReceiveSession,
      updateReceiveSessionItem,
      addWrongItemToSession,
      incrementReceiveQty,
      clearReceiveSession,
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
