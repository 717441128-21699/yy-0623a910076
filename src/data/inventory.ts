import { InventoryItem } from '@/types';
import { productList } from './product';

export const inventoryList: InventoryItem[] = productList.map((product, index) => {
  const consumptionRates = [2, 1.5, 8, 3, 2.5, 1, 0.8, 5, 6, 1.2, 0.3, 0.7];
  const quantities = [18, 12, 75, 35, 28, 8, 5, 25, 80, 10, 2, 15];
  const statuses: Array<'ok' | 'warning' | 'danger'> = ['ok', 'warning', 'ok', 'ok', 'ok', 'warning', 'danger', 'ok', 'ok', 'ok', 'danger', 'ok'];
  
  return {
    id: `inv${index + 1}`,
    productId: product.id,
    product,
    quantity: quantities[index],
    consumptionRate: consumptionRates[index],
    daysRemaining: Math.round(quantities[index] / consumptionRates[index]),
    lastCountDate: '2026-06-19',
    status: statuses[index],
    department: '修复科',
    chairNo: index < 6 ? '1号椅' : '2号椅',
  };
});

export const getInventoryStats = () => {
  const total = inventoryList.length;
  const danger = inventoryList.filter(item => item.status === 'danger').length;
  const warning = inventoryList.filter(item => item.status === 'warning').length;
  const ok = inventoryList.filter(item => item.status === 'ok').length;
  
  return { total, ok, warning, danger };
};

export const getInventoryById = (id: string): InventoryItem | undefined => {
  return inventoryList.find(item => item.id === id);
};

export const getInventoryByProductId = (productId: string): InventoryItem | undefined => {
  return inventoryList.find(item => item.productId === productId);
};

export const getInventoryByBarcode = (barcode: string): InventoryItem | undefined => {
  return inventoryList.find(item => item.product.barcode === barcode);
};
