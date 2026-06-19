import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppState } from '@/store/app-context';
import { Order, ReceiveRecord } from '@/types';

const ReceivePage: React.FC = () => {
  const { orders, receiveRecords } = useAppState();
  const [activeTab, setActiveTab] = useState<'pending' | 'done'>('pending');

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'shipped' || o.status === 'submitted');
  }, [orders]);

  const doneRecords = receiveRecords;

  const handleStartReceive = (order: Order) => {
    Taro.navigateTo({
      url: `/pages/receive-detail/index?orderId=${order.id}`,
    });
  };

  const handleViewRecord = (record: ReceiveRecord) => {
    Taro.navigateTo({
      url: `/pages/receive-detail/index?id=${record.id}`,
    });
  };

  const handleScanReceive = () => {
    Taro.navigateTo({
      url: '/pages/scan/index?mode=receive',
    });
  };

  const hasAbnormal = (items) => {
    return items.some(item => item.status !== 'ok');
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>到货验收</Text>
        <Text className={styles.headerSubtitle}>快速核对，高效入库</Text>
        <View className={styles.statRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{pendingOrders.length}</Text>
            <Text className={styles.statLabel}>待验收</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{doneRecords.length}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <Text
          className={classnames(styles.tabItem, activeTab === 'pending' && styles.active)}
          onClick={() => setActiveTab('pending')}
        >
          待验收
        </Text>
        <Text
          className={classnames(styles.tabItem, activeTab === 'done' && styles.active)}
          onClick={() => setActiveTab('done')}
        >
          已验收
        </Text>
      </View>

      <ScrollView
        className={styles.listContainer}
        scrollY
        style={{ height: 'calc(100vh - 420rpx)' }}
      >
        {activeTab === 'pending' ? (
          pendingOrders.length > 0 ? (
            pendingOrders.map(order => (
              <View key={order.id} className={styles.receiveCard}>
                <View className={styles.cardHeader}>
                  <Text className={styles.orderNo}>{order.orderNo}</Text>
                  <View className={classnames(styles.statusBadge, styles.pending)}>
                    待验收
                  </View>
                </View>
                <View className={styles.cardBody}>
                  <View className={styles.itemPreview}>
                    {order.items.slice(0, 2).map(item => (
                      <Text key={item.productId} className={styles.itemRow}>
                        {item.product.name} × {item.quantity} {item.product.unit}
                      </Text>
                    ))}
                    {order.items.length > 2 && (
                      <Text className={styles.itemRow}>等{order.items.length}项商品</Text>
                    )}
                  </View>
                </View>
                <View className={styles.cardFooter}>
                  <View style={{ flex: 1 }}>
                    <Text className={styles.supplier}>{order.supplierName}</Text>
                    <Text className={styles.expectedDate}>
                      预计到货：{order.expectedDate}
                    </Text>
                  </View>
                  <View className={styles.actionBtn} onClick={() => handleStartReceive(order)}>
                    开始验收
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📭</Text>
              <Text className={styles.emptyText}>暂无待验收订单</Text>
            </View>
          )
        ) : (
          doneRecords.length > 0 ? (
            doneRecords.map(record => (
              <View
                key={record.id}
                className={styles.receiveCard}
                onClick={() => handleViewRecord(record)}
              >
                <View className={styles.cardHeader}>
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    <Text className={styles.orderNo}>{record.orderNo}</Text>
                    {hasAbnormal(record.items) && (
                      <Text className={styles.abnormalTag}>有异常</Text>
                    )}
                  </View>
                  <View className={classnames(styles.statusBadge, styles[record.status])}>
                    {record.status === 'complete' ? '已完成' : '部分收货'}
                  </View>
                </View>
                <View className={styles.cardBody}>
                  <View className={styles.itemPreview}>
                    {record.items.slice(0, 2).map(item => (
                      <Text key={item.productId} className={styles.itemRow}>
                        {item.product.name}：实收 {item.receivedQty}/{item.expectedQty}
                      </Text>
                    ))}
                    {record.items.length > 2 && (
                      <Text className={styles.itemRow}>等{record.items.length}项商品</Text>
                    )}
                  </View>
                </View>
                <View className={styles.cardFooter}>
                  <Text className={styles.supplier}>验收人：{record.operator}</Text>
                  <Text className={styles.expectedDate}>{record.receiveTime}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📦</Text>
              <Text className={styles.emptyText}>暂无验收记录</Text>
            </View>
          )
        )}
      </ScrollView>

      <View className={styles.scanBtn} onClick={handleScanReceive}>
        <Text className={styles.scanBtnIcon}>📷</Text>
        <Text className={styles.scanBtnText}>扫码验收</Text>
      </View>
    </View>
  );
};

export default ReceivePage;
