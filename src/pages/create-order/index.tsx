import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { inventoryList } from '@/data/inventory';
import { categories } from '@/data/product';
import { InventoryItem } from '@/types';

interface SelectedItem {
  productId: string;
  quantity: number;
}

const quickRemarks = ['急用', '可替代品牌', '优先发货', '送货上门'];

const CreateOrderPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [remark, setRemark] = useState('');
  const [activeQuickRemarks, setActiveQuickRemarks] = useState<string[]>([]);

  const filteredInventory = useMemo(() => {
    let list: InventoryItem[] = [...inventoryList];

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.product.category === selectedCategory);
    }

    list.sort((a, b) => {
      const order = { danger: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    return list;
  }, [selectedCategory]);

  const totalInfo = useMemo(() => {
    let count = 0;
    let amount = 0;
    selectedItems.forEach((qty, productId) => {
      const item = inventoryList.find((i) => i.productId === productId);
      if (item) {
        count += qty;
        amount += item.product.price * qty;
      }
    });
    return { count, amount };
  }, [selectedItems]);

  const isAllSelected = useMemo(() => {
    if (filteredInventory.length === 0) return false;
    return filteredInventory.every((item) => selectedItems.has(item.productId));
  }, [filteredInventory, selectedItems]);

  const handleToggleSelect = (productId: string) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      const item = inventoryList.find((i) => i.productId === productId);
      const suggestQty = item ? Math.max(1, Math.ceil(item.product.warnStock * 0.5)) : 1;
      newSelected.set(productId, suggestQty);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      const newSelected = new Map(selectedItems);
      filteredInventory.forEach((item) => {
        newSelected.delete(item.productId);
      });
      setSelectedItems(newSelected);
    } else {
      const newSelected = new Map(selectedItems);
      filteredInventory.forEach((item) => {
        if (!newSelected.has(item.productId)) {
          const suggestQty = Math.max(1, Math.ceil(item.product.warnStock * 0.5));
          newSelected.set(item.productId, suggestQty);
        }
      });
      setSelectedItems(newSelected);
    }
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
      ? activeQuickRemarks.filter((r) => r !== text)
      : [...activeQuickRemarks, text];
    setActiveQuickRemarks(newActive);
    setRemark(newActive.join('、'));
  };

  const handleSubmit = () => {
    if (selectedItems.size === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认下单',
      content: `共${totalInfo.count}件商品，合计¥${totalInfo.amount.toFixed(2)}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '下单成功', icon: 'success' });
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/order/index' });
          }, 1500);
        }
      },
    });
  };

  const getStockStatus = (status) => {
    switch (status) {
      case 'ok': return '充足';
      case 'warning': return '偏低';
      case 'danger': return '缺货';
      default: return '';
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.filterBar}>
        <View className={classnames(styles.filterItem, styles.active)}>
          <Text className={styles.filterIcon}>🏥</Text>
          <Text>全科室</Text>
        </View>
        <View className={styles.filterItem}>
          <Text className={styles.filterIcon}>💺</Text>
          <Text>椅位</Text>
        </View>
        <View className={styles.filterItem}>
          <Text className={styles.filterIcon}>⭐</Text>
          <Text>常用</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.categoryScroll} enhanced showScrollbar={false}>
        {categories.map((cat) => (
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
          onInput={(e) => setRemark(e.detail.value)}
        />
        <View className={styles.quickRemarks}>
          {quickRemarks.map((text) => (
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
          filteredInventory.map((item) => {
            const isChecked = selectedItems.has(item.productId);
            const qty = selectedItems.get(item.productId) || 0;

            return (
              <View key={item.id} className={styles.productItem}>
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

                <View className={styles.productRight}>
                  <Text className={styles.price}>¥{item.product.price}</Text>
                  {isChecked && (
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
                  )}
                </View>
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
          <Text className={styles.totalText}>
            已选 {totalInfo.count} 件
          </Text>
          <Text className={styles.totalAmount}>¥{totalInfo.amount.toFixed(2)}</Text>
        </View>
        <View
          className={classnames(styles.submitBtn, selectedItems.size === 0 && styles.disabled)}
          onClick={handleSubmit}
        >
          确认下单
        </View>
      </View>
    </View>
  );
};

export default CreateOrderPage;
