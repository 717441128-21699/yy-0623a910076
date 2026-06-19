import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
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

  const { orders, receiveRecords, addReceiveRecord, updateOrder } = useAppState();

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

  useEffect(() => {
    if (existingRecord) {
      setItems(existingRecord.items.map(item => ({ ...item })));
    } else if (order) {
      const initialItems: ReceiveItemState[] = order.items.map(item => ({
        productId: item.productId,
        product: item.product,
        expectedQty: item.quantity,
        receivedQty: 0,
        status: 'pending' as const,
      }));
      setItems(initialItems);
    }
  }, [order, existingRecord]);

  const summary = useMemo(() => {
    const totalExpected = items.reduce((sum, item) => sum + item.expectedQty, 0);
    const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0);
    const abnormalCount = items.filter(item => item.status !== 'pending' && item.status !== 'ok').length;
    const completedCount = items.filter(item => item.status !== 'pending').length;
    return { totalExpected, totalReceived, abnormalCount, completedCount };
  }, [items]);

  const handleQtyChange = (index: number, delta: number) => {
    if (isViewMode) return;
    const newItems = [...items];
    const item = { ...newItems[index] };
    item.receivedQty = Math.max(0, item.receivedQty + delta);

    if (item.receivedQty === 0) {
      item.status = 'pending';
    } else if (item.receivedQty === item.expectedQty) {
      item.status = 'ok';
    } else if (item.receivedQty < item.expectedQty) {
      item.status = 'shortage';
    } else {
      item.status = 'excess';
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSetStatus = (index: number, status: ReceiveItem['status']) => {
    if (isViewMode) return;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], status };
    setItems(newItems);
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
    Taro.showToast({ title: '已全部标记为已收货', icon: 'success' });
  };

  const handleSubmit = () => {
    if (summary.completedCount === 0) {
      Taro.showToast({ title: '请先验收商品', icon: 'none' });
      return;
    }

    const hasAbnormal = summary.abnormalCount > 0;
    const content = hasAbnormal
      ? `验收完成，共${items.length}项商品，其中${summary.abnormalCount}项存在异常，是否提交验收记录？`
      : `验收完成，共${items.length}项商品全部正常，是否提交验收记录？`;

    Taro.showModal({
      title: '确认提交',
      content,
      success: (res) => {
        if (res.confirm) {
          const now = new Date();
          const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          const recordStatus = summary.abnormalCount > 0
            ? (items.every(i => i.status === 'ok') ? 'complete' : 'partial')
            : 'complete';

          const newRecord = {
            id: `r_new_${Date.now()}`,
            orderId: order!.id,
            orderNo: order!.orderNo,
            items: items.filter(i => i.status !== 'pending'),
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
            <Text className={styles.itemCount}>共 {items.length} 项</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={item.productId}
              className={classnames(styles.receiveItem, item.status !== 'ok' && item.status !== 'pending' && styles.abnormal)}
            >
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

              <View className={styles.qtyRow}>
                <Text className={styles.qtyLabel}>应收数量</Text>
                <Text className={styles.qtyValue}>
                  {item.expectedQty} {item.product.unit}
                </Text>
              </View>

              {!isViewMode ? (
                <View className={styles.qtyRow}>
                  <Text className={styles.qtyLabel}>实收数量</Text>
                  <View className={styles.qtyControl}>
                    <View
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(index, -1)}
                    >
                      −
                    </View>
                    <Input
                      className={styles.qtyInput}
                      type="number"
                      value={String(item.receivedQty)}
                      onInput={(e) => {
                        const val = parseInt(e.detail.value) || 0;
                        const newItems = [...items];
                        newItems[index] = {
                          ...newItems[index],
                          receivedQty: val,
                          status: val === 0 ? 'pending' : val === item.expectedQty ? 'ok' : val < item.expectedQty ? 'shortage' : 'excess',
                        };
                        setItems(newItems);
                      }}
                    />
                    <View
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(index, 1)}
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
                  <View className={styles.abnormalReasons}>
                    <Text
                      className={classnames(styles.reasonTag, item.status === 'shortage' && styles.active)}
                      onClick={() => handleSetStatus(index, 'shortage')}
                    >
                      缺货
                    </Text>
                    <Text
                      className={classnames(styles.reasonTag, item.status === 'wrong' && styles.active)}
                      onClick={() => handleSetStatus(index, 'wrong')}
                    >
                      错发
                    </Text>
                    <Text
                      className={classnames(styles.reasonTag, item.status === 'expiring' && styles.active)}
                      onClick={() => handleSetStatus(index, 'expiring')}
                    >
                      临期
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
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
