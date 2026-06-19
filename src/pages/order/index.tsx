import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import OrderCard from '@/components/OrderCard';
import { useAppState } from '@/store/app-context';
import { Order } from '@/types';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待提交' },
  { key: 'submitted', label: '已提交' },
  { key: 'shipped', label: '配送中' },
  { key: 'received', label: '已收货' },
  { key: 'cancelled', label: '已取消' },
];

const OrderPage: React.FC = () => {
  const { orders } = useAppState();
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    return orders.filter(order => order.status === activeTab);
  }, [activeTab, orders]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
    };
  }, [orders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  };

  const handleCreateOrder = () => {
    Taro.navigateTo({ url: '/pages/create-order/index' });
  };

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${order.id}`,
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.headerTitle}>订货单</Text>
        </View>
        <Text className={styles.headerCount}>共 {orders.length} 条</Text>
      </View>

      <View className={styles.summaryBar}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{stats.total}</Text>
          <Text className={styles.summaryLabel}>全部订单</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{stats.pending}</Text>
          <Text className={styles.summaryLabel}>待提交</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{stats.shipped}</Text>
          <Text className={styles.summaryLabel}>配送中</Text>
        </View>
      </View>

      <ScrollView scrollX className={styles.tabs} enhanced showScrollbar={false}>
        {tabs.map(tab => (
          <Text
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </ScrollView>

      <ScrollView
        className={styles.listContainer}
        scrollY
        refresherEnabled
        refresherTriggered={isRefreshing}
        onRefresherRefresh={handleRefresh}
        style={{ height: 'calc(100vh - 360rpx)' }}
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} onClick={() => handleOrderClick(order)} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无订货单</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.fab} onClick={handleCreateOrder}>
        <Text className={styles.fabIcon}>+</Text>
        <Text className={styles.fabText}>新建</Text>
      </View>
    </View>
  );
};

export default OrderPage;
