import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppState } from '@/store/app-context';
import { ReceiveItem } from '@/types';

interface ReceiveItemState extends ReceiveItem {
  receivedQty: number;
}

const statusTextMap = {
  ok: '正常',
  shortage: '缺货',
  excess: '多发',
  wrong: '错发',
  expiring: '临期',
  pending: '待验收',
};

const ReceiveDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId as string;
  const recordId = router.params.id as string;

  const {
    orders,
    receiveRecords,
    currentReceiveSession,
    addReceiveRecord,
    updateOrder,
    startReceiveSession,
    updateReceiveSessionItem,
    clearReceiveSession,
  } = useAppState();

  const order = useMemo(() => {
    if (orderId) return orders.find(o => o.id === orderId) || null;
    if (recordId) {
      const record = receiveRecords.find(r => r.id === recordId);
      return record ? orders.find(o => o.id === record.orderId) || null : null;
    }
    return null;
  }, [orders, receiveRecords, orderId, recordId]);

  const existingRecord = useMemo(() => {
    if (recordId) return receiveRecords.find(r => r.id === recordId) || null;
    return null;
  }, [receiveRecords, recordId]);

  const isViewMode = !!existingRecord;

  const [items, setItems] = useState<ReceiveItemState[]>([]);
  const [wrongItems, setWrongItems] = useState<ReceiveItemState[]>([]);

  const syncFromSession = () => {
    if (isViewMode || !order || !currentReceiveSession) return;
    if (currentReceiveSession.orderId !== order.id) return;

    setItems(currentReceiveSession.items.map(i => ({ ...i })));
    setWrongItems(currentReceiveSession.wrongItems.map(i => ({ ...i })));
  };

  useEffect(() => {
    if (existingRecord) {
      const allItems = existingRecord.items;
      const normalItems = allItems.filter(i => i.status !== 'wrong');
      const wrongItemsList = allItems.filter(i => i.status === 'wrong');
      setItems(normalItems.map(item => ({ ...item })));
      setWrongItems(wrongItemsList.map(item => ({ ...item })));
    } else if (order) {
      if (currentReceiveSession && currentReceiveSession.orderId === order.id) {
        syncFromSession();
      } else {
        const initialItems: ReceiveItemState[] = order.items.map(item => ({
          productId: item.productId,
          product: item.product,
          expectedQty: item.quantity,
          receivedQty: 0,
          status: 'pending' as const,
        }));
        setItems(initialItems);
        setWrongItems([]);
        startReceiveSession(order.id, initialItems);
      }
    }
  }, [order, existingRecord]);

  useDidShow(() => {
    syncFromSession();
  });

  const summary = useMemo(() => {
    const allItems = [...items, ...wrongItems];
    const totalExpected = items.reduce((sum, item) => sum + item.expectedQty, 0);
    const totalReceived = allItems.reduce((sum, item) => sum + item.receivedQty, 0);
    const abnormalCount = allItems.filter(item => item.status !== 'pending' && item.status !== 'ok').length;
    const completedCount = allItems.filter(item => item.status !== 'pending').length;
    return { totalExpected, totalReceived, abnormalCount, completedCount, totalItems: allItems.length };
  }, [items, wrongItems]);

  const updateLocalAndSession = (index: number, field: 'items' | 'wrongItems', updates: Partial<ReceiveItemState>) => {
    if (isViewMode) return;

    const targetArray = field === 'items' ? [...items] : [...wrongItems];
    targetArray[index] = { ...targetArray[index], ...updates };

    if (field === 'items') {
      setItems(targetArray);
    } else {
      setWrongItems(targetArray);
    }

    updateReceiveSessionItem(targetArray[index].productId, updates);
  };

  const handleQtyChange = (index: number, delta: number, field: 'items' | 'wrongItems' = 'items') => {
    if (isViewMode) return;
    const targetArray = field === 'items' ? items : wrongItems;
    const item = { ...targetArray[index] };
    item.receivedQty = Math.max(0, item.receivedQty + delta);

    if (item.receivedQty === 0) {
      item.status = 'pending';
    } else if (field === 'wrongItems') {
      item.status = 'wrong';
    } else if (item.receivedQty === item.expectedQty) {
      if (item.status !== 'expiring') item.status = 'ok';
    } else if (item.receivedQty < item.expectedQty) {
      if (item.status !== 'expiring' && item.status !== 'wrong') item.status = 'shortage';
    } else {
      if (item.status !== 'expiring' && item.status !== 'wrong') item.status = 'excess';
    }

    updateLocalAndSession(index, field, { receivedQty: item.receivedQty, status: item.status });
  };

  const handleSetStatus = (index: number, status: ReceiveItem['status'], field: 'items' | 'wrongItems' = 'items') => {
    if (isViewMode) return;
    updateLocalAndSession(index, field, { status });
  };

  const handleScan = () => {
    if (isViewMode || !order) return;
    Taro.navigateTo({
      url: `/pages/scan/index?mode=receive&orderId=${order.id}`,
    });
  };

  const handleMarkAllReceived = () => {
    if (isViewMode) return;
    const newItems = items.map(item => ({
      ...item,
      receivedQty: item.expectedQty,
      status: 'ok' as const,
    }));
    setItems(newItems);

    if (currentReceiveSession && currentReceiveSession.orderId === order!.id) {
      newItems.forEach(item => {
        updateReceiveSessionItem(item.productId, { receivedQty: item.receivedQty, status: item.status });
      });
    }

    Taro.showToast({ title: '已全部标记为已收货', icon: 'success' });
  };

  const handleSubmit = () => {
    if (summary.completedCount === 0) {
      Taro.showToast({ title: '请先验收商品', icon: 'none' });
      return;
    }

    const hasAbnormal = summary.abnormalCount > 0;
    const wrongItemCount = wrongItems.length;
    let content = '';

    if (wrongItemCount > 0) {
      content = `验收完成，共${items.length}项订单项 + ${wrongItemCount}项错发商品，其中${summary.abnormalCount}项存在异常，是否提交验收记录？`;
    } else if (hasAbnormal) {
      content = `验收完成，共${items.length}项商品，其中${summary.abnormalCount}项存在异常，是否提交验收记录？`;
    } else {
      content = `验收完成，共${items.length}项商品全部正常，是否提交验收记录？`;
    }

    Taro.showModal({
      title: '确认提交',
      content,
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          const allItems = [...items.filter(i => i.status !== 'pending'), ...wrongItems];
          const recordStatus = allItems.every(i => i.status === 'ok') ? 'complete' : 'partial';

          const newRecord = {
            id: `r_new_${Date.now()}`,
            orderId: order!.id,
            orderNo: order!.orderNo,
            items: allItems,
            totalExpected: summary.totalExpected,
            totalReceived: summary.totalReceived,
            status: recordStatus as 'pending' | 'partial' | 'complete',
            receiveTime: timeStr,
            operator: '张护士长',
          };

          addReceiveRecord(newRecord);
          updateOrder(order!.id, {
            status: 'received',
            receiveTime: timeStr,
          });
          clearReceiveSession();

          Taro.showToast({ title: '验收记录已生成', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      },
    });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '120rpx', opacity: 0.3 }}>❓</Text>
          <Text style={{ fontSize: '28rpx', color: '#86909c', marginTop: '24rpx' }}>
            订单不存在
          </Text>
        </View>
      </View>
    );
  }

  const allItemsToRender = [
    ...items.map(item => ({ ...item, field: 'items' as const })),
    ...wrongItems.map(item => ({ ...item, field: 'wrongItems' as const })),
  ];

  return (
    <View className={styles.page}>
      <View className={styles.orderInfo}>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
        <Text className={styles.orderMeta}>
          {order.supplierName} · 预计到货 {order.expectedDate}
        </Text>
      </View>

      <View className={styles.summaryBar}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{summary.totalExpected}</Text>
          <Text className={styles.summaryLabel}>应到总数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(summary.totalReceived > 0 && styles.ok, styles.summaryValue)}>
            {summary.totalReceived}
          </Text>
          <Text className={styles.summaryLabel}>实到总数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={classnames(summary.abnormalCount > 0 && styles.error, styles.summaryValue)}>
            {summary.abnormalCount}
          </Text>
          <Text className={styles.summaryLabel}>异常项</Text>
        </View>
      </View>

      {!isViewMode && (
        <View className={styles.scanTip}>
          <Text className={styles.scanTipText}>💡 点击扫码，快速核对商品</Text>
          <View className={styles.scanTipBtn} onClick={handleScan}>
            扫码验收
          </View>
        </View>
      )}

      <ScrollView scrollY style={{ height: 'calc(100vh - 460rpx)' }}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📦</Text>
              验收清单
            </Text>
            <Text className={styles.itemCount}>共 {summary.totalItems} 项</Text>
          </View>

          {allItemsToRender.map((item, index) => {
            const arrayIndex = item.field === 'items'
              ? items.findIndex(i => i.productId === item.productId)
              : wrongItems.findIndex(i => i.productId === item.productId);

            return (
              <View
                key={`${item.field}-${item.productId}`}
                className={classnames(
                  styles.receiveItem,
                  item.status !== 'ok' && item.status !== 'pending' && styles.abnormal
                )}
              >
                {item.field === 'wrongItems' && (
                  <View className={styles.wrongItemBanner}>
                    <Text className={styles.wrongItemText}>⚠️ 错发商品（不在订货单中）</Text>
                  </View>
                )}

                <View className={styles.itemHeader}>
                  <View className={styles.itemInfo}>
                    <Text className={styles.itemName}>{item.product.name}</Text>
                    <Text className={styles.itemSpec}>
                      {item.product.spec} · {item.product.brand}
                    </Text>
                  </View>
                  <View className={classnames(styles.itemStatus, styles[item.status])}>
                    {statusTextMap[item.status]}
                  </View>
                </View>

                {item.field === 'items' && (
                  <View className={styles.qtyRow}>
                    <Text className={styles.qtyLabel}>应收数量</Text>
                    <Text className={styles.qtyValue}>
                      {item.expectedQty} {item.product.unit}
                    </Text>
                  </View>
                )}

                {!isViewMode ? (
                  <View className={styles.qtyRow}>
                    <Text className={styles.qtyLabel}>实收数量</Text>
                    <View className={styles.qtyControl}>
                      <View
                        className={styles.qtyBtn}
                        onClick={() => handleQtyChange(arrayIndex, -1, item.field)}
                      >
                        −
                      </View>
                      <Input
                        className={styles.qtyInput}
                        type="number"
                        value={String(item.receivedQty)}
                        onInput={(e) => {
                          const val = parseInt(e.detail.value) || 0;
                          const targetArray = item.field === 'items' ? items : wrongItems;
                          const currentItem = targetArray[arrayIndex];
                          let newStatus: ReceiveItem['status'] = 'pending';

                          if (val > 0) {
                            if (item.field === 'wrongItems') {
                              newStatus = 'wrong';
                            } else if (val === currentItem.expectedQty) {
                              newStatus = currentItem.status === 'expiring' ? 'expiring' : 'ok';
                            } else if (val < currentItem.expectedQty) {
                              newStatus = currentItem.status === 'expiring' || currentItem.status === 'wrong'
                                ? currentItem.status : 'shortage';
                            } else {
                              newStatus = currentItem.status === 'expiring' || currentItem.status === 'wrong'
                                ? currentItem.status : 'excess';
                            }
                          }

                          updateLocalAndSession(arrayIndex, item.field, { receivedQty: val, status: newStatus });
                        }}
                      />
                      <View
                        className={styles.qtyBtn}
                        onClick={() => handleQtyChange(arrayIndex, 1, item.field)}
                      >
                        +
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className={styles.qtyRow}>
                    <Text className={styles.qtyLabel}>实收数量</Text>
                    <Text
                      className={classnames(
                        styles.qtyValue,
                        item.status !== 'ok' && item.status !== 'pending' && { color: '#f53f3f' }
                      )}
                    >
                      {item.receivedQty} {item.product.unit}
                    </Text>
                  </View>
                )}

                {!isViewMode && (
                  <View className={styles.itemFooter}>
                    <Text className={styles.batchInfo}>
                      批号：{item.batchNo || '未录入'} · 有效期：{item.expiryDate || '未录入'}
                    </Text>
                    {item.field === 'items' && (
                      <View className={styles.abnormalReasons}>
                        <Text
                          className={classnames(styles.reasonTag, item.status === 'shortage' && styles.active)}
                          onClick={() => handleSetStatus(arrayIndex, 'shortage', item.field)}
                        >
                          缺货
                        </Text>
                        <Text
                          className={classnames(styles.reasonTag, item.status === 'expiring' && styles.active)}
                          onClick={() => handleSetStatus(arrayIndex, 'expiring', item.field)}
                        >
                          临期
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: '40rpx' }} />
      </ScrollView>

      {!isViewMode && (
        <View className={styles.bottomBar}>
          <View className={styles.secondaryBtn} onClick={handleMarkAllReceived}>
            <Text className={styles.btnIcon}>✓</Text>
            全部确认
          </View>
          <View className={styles.primaryBtn} onClick={handleSubmit}>
            <Text className={styles.btnIcon}>📝</Text>
            生成验收记录
          </View>
        </View>
      )}
    </View>
  );
};

export default ReceiveDetailPage;
