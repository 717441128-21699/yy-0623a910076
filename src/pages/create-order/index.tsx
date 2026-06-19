import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { inventoryList } from '@/data/inventory';
import { categories } from '@/data/product';
import { departments } from '@/data/supplier';
import { getSupplierById } from '@/data/supplier';
import { useAppState } from '@/store/app-context';
import { InventoryItem, Order, OrderItem } from '@/types';

type FilterMode = 'all' | 'dept' | 'chair' | 'frequent';

const quickRemarks = ['急用', '可替代品牌', '优先发货', '送货上门'];
const frequentProductIds = ['p001', 'p003', 'p004', 'p005', 'p006', 'p008', 'p009'];

const CreateOrderPage: React.FC = () => {
  const { addOrder } = useAppState();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedChair, setSelectedChair] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [remark, setRemark] = useState('');
  const [activeQuickRemarks, setActiveQuickRemarks] = useState<string[]>([]);
  const [showReview, setShowReview] = useState(false);

  const filteredInventory = useMemo(() => {
    let list: InventoryItem[] = [...inventoryList];

    if (filterMode === 'dept') {
      if (selectedDept !== 'all') {
        const dept = departments.find(d => d.id === selectedDept);
        if (dept) {
          const chairs = dept.chairNos;
          list = list.filter(item => chairs.includes(item.chairNo || ''));
        }
      }
    } else if (filterMode === 'chair') {
      if (selectedChair !== 'all') {
        list = list.filter(item => item.chairNo === selectedChair);
      }
    } else if (filterMode === 'frequent') {
      list = list.filter(item => frequentProductIds.includes(item.productId));
    }

    if (selectedCategory !== 'all') {
      list = list.filter(item => item.product.category === selectedCategory);
    }

    list.sort((a, b) => {
      const order = { danger: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    return list;
  }, [filterMode, selectedDept, selectedChair, selectedCategory]);

  const allChairs = useMemo(() => {
    const chairs: string[] = [];
    departments.forEach(d => d.chairNos.forEach(c => { if (!chairs.includes(c)) chairs.push(c); }));
    return chairs;
  }, []);

  const totalInfo = useMemo(() => {
    let count = 0;
    let amount = 0;
    selectedItems.forEach((qty, productId) => {
      const item = inventoryList.find(i => i.productId === productId);
      if (item) {
        count += qty;
        amount += item.product.price * qty;
      }
    });
    return { count, amount };
  }, [selectedItems]);

  const isAllSelected = useMemo(() => {
    if (filteredInventory.length === 0) return false;
    return filteredInventory.every(item => selectedItems.has(item.productId));
  }, [filteredInventory, selectedItems]);

  const handleToggleSelect = (productId: string) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      const item = inventoryList.find(i => i.productId === productId);
      const deficit = item ? Math.max(0, item.product.warnStock - item.quantity) : 0;
      const suggestQty = deficit > 0 ? deficit : Math.max(1, Math.ceil(item.product.warnStock * 0.5));
      newSelected.set(productId, suggestQty);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Map(selectedItems);
    if (isAllSelected) {
      filteredInventory.forEach(item => newSelected.delete(item.productId));
    } else {
      filteredInventory.forEach(item => {
        if (!newSelected.has(item.productId)) {
          const deficit = Math.max(0, item.product.warnStock - item.quantity);
          const suggestQty = deficit > 0 ? deficit : Math.max(1, Math.ceil(item.product.warnStock * 0.5));
          newSelected.set(item.productId, suggestQty);
        }
      });
    }
    setSelectedItems(newSelected);
  };

  const handleQtyChange = (productId: string, delta: number) => {
    const newSelected = new Map(selectedItems);
    const currentQty = newSelected.get(productId) || 0;
    const newQty = Math.max(1, currentQty + delta);
    newSelected.set(productId, newQty);
    setSelectedItems(newSelected);
  };

  const handleQuickRemark = (text: string) => {
    const newActive = activeQuickRemarks.includes(text)
      ? activeQuickRemarks.filter(r => r !== text)
      : [...activeQuickRemarks, text];
    setActiveQuickRemarks(newActive);
    setRemark(newActive.join('、'));
  };

  const handleSubmit = () => {
    if (selectedItems.size === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    setShowReview(true);
  };

  const handleConfirmOrder = () => {
    const orderItems: OrderItem[] = [];
    selectedItems.forEach((qty, productId) => {
      const item = inventoryList.find(i => i.productId === productId);
      if (item) {
        orderItems.push({
          productId,
          product: item.product,
          quantity: qty,
          unitPrice: item.product.price,
          subtotal: item.product.price * qty,
          remark: '',
        });
      }
    });

    const firstItem = orderItems[0];
    const supplierId = firstItem?.product.supplierId || '';
    const supplier = getSupplierById(supplierId);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNo = `DD${dateStr}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const expectedDate = new Date(now.getTime() + (supplier?.deliveryDays || 2) * 24 * 60 * 60 * 1000);
    const expectedDateStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;

    const newOrder: Order = {
      id: `o_new_${Date.now()}`,
      orderNo,
      status: 'pending',
      items: orderItems,
      totalAmount: totalInfo.amount,
      totalQuantity: totalInfo.count,
      supplierId,
      supplierName: supplier?.name || firstItem?.product.supplierName || '',
      department: selectedDept !== 'all' ? departments.find(d => d.id === selectedDept)?.name : undefined,
      chairNo: selectedChair !== 'all' ? selectedChair : undefined,
      expectedDate: expectedDateStr,
      createTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
      remark: remark || undefined,
      urgency: activeQuickRemarks.includes('急用') ? 'urgent' : 'normal',
    };

    addOrder(newOrder);
    setShowReview(false);
    Taro.showToast({ title: '下单成功', icon: 'success' });
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/order/index' });
    }, 1200);
  };

  const getStockStatus = (status) => {
    switch (status) {
      case 'ok': return '充足';
      case 'warning': return '偏低';
      case 'danger': return '缺货';
      default: return '';
    }
  };

  const renderSubFilter = () => {
    if (filterMode === 'dept') {
      return (
        <ScrollView scrollX className={styles.subFilterBar} enhanced showScrollbar={false}>
          <Text
            className={classnames(styles.subFilterItem, selectedDept === 'all' && styles.active)}
            onClick={() => setSelectedDept('all')}
          >
            全部科室
          </Text>
          {departments.map(d => (
            <Text
              key={d.id}
              className={classnames(styles.subFilterItem, selectedDept === d.id && styles.active)}
              onClick={() => { setSelectedDept(d.id); setSelectedChair('all'); }}
            >
              {d.name}
            </Text>
          ))}
        </ScrollView>
      );
    }
    if (filterMode === 'chair') {
      return (
        <ScrollView scrollX className={styles.subFilterBar} enhanced showScrollbar={false}>
          <Text
            className={classnames(styles.subFilterItem, selectedChair === 'all' && styles.active)}
            onClick={() => setSelectedChair('all')}
          >
            全部椅位
          </Text>
          {allChairs.map(c => (
            <Text
              key={c}
              className={classnames(styles.subFilterItem, selectedChair === c && styles.active)}
              onClick={() => setSelectedChair(c)}
            >
              {c}
            </Text>
          ))}
        </ScrollView>
      );
    }
    return null;
  };

  const reviewItems = useMemo(() => {
    const items: { name: string; spec: string; supplier: string; qty: number; price: number; subtotal: number; deliveryDays: number }[] = [];
    selectedItems.forEach((qty, productId) => {
      const item = inventoryList.find(i => i.productId === productId);
      if (item) {
        const supplier = getSupplierById(item.product.supplierId);
        items.push({
          name: item.product.name,
          spec: item.product.spec,
          supplier: item.product.supplierName,
          qty,
          price: item.product.price,
          subtotal: item.product.price * qty,
          deliveryDays: supplier?.deliveryDays || 2,
        });
      }
    });
    return items;
  }, [selectedItems]);

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <View
          className={classnames(styles.filterItem, filterMode === 'all' && styles.active)}
          onClick={() => setFilterMode('all')}
        >
          <Text className={styles.filterIcon}>🏥</Text>
          <Text>全科室</Text>
        </View>
        <View
          className={classnames(styles.filterItem, filterMode === 'dept' && styles.active)}
          onClick={() => setFilterMode('dept')}
        >
          <Text className={styles.filterIcon}>🏢</Text>
          <Text>科室</Text>
        </View>
        <View
          className={classnames(styles.filterItem, filterMode === 'chair' && styles.active)}
          onClick={() => setFilterMode('chair')}
        >
          <Text className={styles.filterIcon}>💺</Text>
          <Text>椅位</Text>
        </View>
        <View
          className={classnames(styles.filterItem, filterMode === 'frequent' && styles.active)}
          onClick={() => setFilterMode('frequent')}
        >
          <Text className={styles.filterIcon}>⭐</Text>
          <Text>常用</Text>
        </View>
      </View>

      {renderSubFilter()}

      <ScrollView scrollX className={styles.categoryScroll} enhanced showScrollbar={false}>
        {categories.map(cat => (
          <Text
            key={cat.id}
            className={classnames(styles.categoryTag, selectedCategory === cat.id && styles.active)}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Text>
        ))}
      </ScrollView>

      <View className={styles.remarkSection}>
        <Text className={styles.remarkTitle}>订单备注</Text>
        <Input
          className={styles.remarkInput}
          placeholder="请输入备注信息，如急用、可替代品牌等"
          placeholderClass={styles.placeholder}
          value={remark}
          onInput={e => setRemark(e.detail.value)}
        />
        <View className={styles.quickRemarks}>
          {quickRemarks.map(text => (
            <Text
              key={text}
              className={classnames(styles.quickRemark, activeQuickRemarks.includes(text) && styles.active)}
              onClick={() => handleQuickRemark(text)}
            >
              {text}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView className={styles.productList} scrollY style={{ height: 'calc(100vh - 520rpx)' }}>
        {filteredInventory.length > 0 ? (
          filteredInventory.map(item => {
            const isChecked = selectedItems.has(item.productId);
            const qty = selectedItems.get(item.productId) || 0;
            const supplier = getSupplierById(item.product.supplierId);

            return (
              <View key={item.id} className={styles.productItem}>
                <View className={styles.productTop}>
                  <View
                    className={classnames(styles.checkbox, isChecked && styles.checked)}
                    onClick={() => handleToggleSelect(item.productId)}
                  >
                    {isChecked && <Text className={styles.checkIcon}>✓</Text>}
                  </View>
                  <View className={styles.productInfo} onClick={() => handleToggleSelect(item.productId)}>
                    <Text className={styles.productName}>{item.product.name}</Text>
                    <Text className={styles.productSpec}>{item.product.spec}</Text>
                    <View className={styles.productMeta}>
                      <Text className={styles.brandTag}>{item.product.brand}</Text>
                      <Text className={classnames(styles.stockTag, styles[item.status])}>
                        库存{getStockStatus(item.status)}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.priceInfo}>
                    <Text className={styles.price}>¥{item.product.price}</Text>
                    <Text className={styles.priceUnit}>/{item.product.unit}</Text>
                  </View>
                </View>

                <View className={styles.supplierRow}>
                  <View className={styles.supplierInfo}>
                    <Text className={styles.supplierName}>{item.product.supplierName}</Text>
                    <Text className={styles.deliveryDays}>
                      约{supplier?.deliveryDays || 2}天到货
                    </Text>
                  </View>
                </View>

                {isChecked && (
                  <View className={styles.qtyRow}>
                    <Text className={styles.qtyLabel}>订货数量</Text>
                    <View className={styles.qtyControl}>
                      <View
                        className={classnames(styles.qtyBtn, qty <= 1 && styles.disabled)}
                        onClick={() => handleQtyChange(item.productId, -1)}
                      >
                        −
                      </View>
                      <Text className={styles.qtyInput}>{qty}</Text>
                      <View
                        className={styles.qtyBtn}
                        onClick={() => handleQtyChange(item.productId, 1)}
                      >
                        +
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无该分类商品</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.bottomLeft}>
          <View className={styles.selectAll} onClick={handleSelectAll}>
            <View className={classnames(styles.checkbox, isAllSelected && styles.checked)}>
              {isAllSelected && <Text className={styles.checkIcon}>✓</Text>}
            </View>
            <Text className={styles.selectAllText}>全选</Text>
          </View>
        </View>
        <View className={styles.bottomLeft}>
          <Text className={styles.totalText}>已选 {totalInfo.count} 件</Text>
          <Text className={styles.totalAmount}>¥{totalInfo.amount.toFixed(2)}</Text>
        </View>
        <View
          className={classnames(styles.submitBtn, selectedItems.size === 0 && styles.disabled)}
          onClick={handleSubmit}
        >
          核对下单
        </View>
      </View>

      {showReview && (
        <View className={styles.reviewOverlay} onClick={() => setShowReview(false)}>
          <View className={styles.reviewPanel} onClick={e => e.stopPropagation()}>
            <View className={styles.reviewHeader}>
              <Text className={styles.reviewTitle}>核对订单</Text>
              <Text className={styles.reviewClose} onClick={() => setShowReview(false)}>✕</Text>
            </View>

            {reviewItems.map((item, idx) => (
              <View key={idx} className={styles.reviewItem}>
                <View className={styles.reviewItemInfo}>
                  <Text className={styles.reviewItemName}>{item.name}</Text>
                  <Text className={styles.reviewItemSpec}>{item.spec}</Text>
                  <Text className={styles.reviewItemSupplier}>
                    {item.supplier} · 约{item.deliveryDays}天到货
                  </Text>
                </View>
                <View className={styles.reviewItemRight}>
                  <Text className={styles.reviewItemQty}>× {item.qty}</Text>
                  <Text className={styles.reviewItemPrice}>¥{item.subtotal.toFixed(2)}</Text>
                </View>
              </View>
            ))}

            <View className={styles.reviewTotal}>
              <Text className={styles.reviewTotalLabel}>合计（{totalInfo.count}件）</Text>
              <Text className={styles.reviewTotalAmount}>¥{totalInfo.amount.toFixed(2)}</Text>
            </View>

            {remark && (
              <View className={styles.reviewRemark}>
                <Text className={styles.reviewRemarkLabel}>备注</Text>
                <Text className={styles.reviewRemarkText}>{remark}</Text>
              </View>
            )}

            <View className={styles.reviewActions}>
              <View className={styles.reviewCancelBtn} onClick={() => setShowReview(false)}>
                返回修改
              </View>
              <View className={styles.reviewConfirmBtn} onClick={handleConfirmOrder}>
                确认下单
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default CreateOrderPage;
