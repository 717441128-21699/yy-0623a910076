import { Supplier } from '@/types';

export const supplierList: Supplier[] = [
  {
    id: 's001',
    name: '华东医疗器械有限公司',
    contact: '张经理',
    phone: '13800138001',
    address: '上海市浦东新区张江高科技园区',
    deliveryDays: 2,
  },
  {
    id: 's002',
    name: '康泰医药',
    contact: '李经理',
    phone: '13800138002',
    address: '北京市朝阳区建国路88号',
    deliveryDays: 3,
  },
  {
    id: 's003',
    name: '恒康医疗用品',
    contact: '王经理',
    phone: '13800138003',
    address: '广州市天河区珠江新城',
    deliveryDays: 1,
  },
];

export const getSupplierById = (id: string): Supplier | undefined => {
  return supplierList.find(s => s.id === id);
};

export const departments = [
  {
    id: 'd001',
    name: '修复科',
    chairNos: ['1号椅', '2号椅', '3号椅'],
  },
  {
    id: 'd002',
    name: '牙体牙髓科',
    chairNos: ['4号椅', '5号椅'],
  },
  {
    id: 'd003',
    name: '综合科',
    chairNos: ['6号椅', '7号椅', '8号椅'],
  },
  {
    id: 'd004',
    name: '正畸科',
    chairNos: ['9号椅', '10号椅'],
  },
];
