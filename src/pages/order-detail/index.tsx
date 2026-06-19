import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useAppState } from '@/store/app-context';
import { Order } from '@/types';

const statusMap = {
  pending: { text: '待提交', color: 'warning' },
  submitted: { text: '已提交', color: 'primary' },
  shipped: { text: '配送中', color: 'primary' },
  received: { text: '已收货', color: 'success' },
  cancelled: { text: '已取消', color: 'disabled' },
};

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id as string;
  const { orders, updateOrder } = useAppState();

  const order = useMemo(() => {
    return orders.find(o => o.id === orderId) || null;
  }, [orders, orderId]);

  const getTimeline = () => {
    if (!order) return [];
    const timeline = [
      { title: '订单创建', time: order.createTime, status: 'done' },
    ];
    if (order.submitTime) {
      timeline.push({ title: '已提交给供应商', time: order.submitTime, status: 'done' });
    } else {
      timeline.push({ title: '待提交', time: '', status: 'pending' });
    }
    if (order.status === 'shipped' || order.status === 'received') {
      timeline.push({ title: '商品已发出', time: '2026-06-19 08:00:00', status: 'done' });
    } else if (order.status === 'submitted') {
      timeline.push({ title: '待发货', time: '', status: 'pending' });
    }
    if (order.receiveTime) {
      timeline.push({ title: '已验收入库', time: order.receiveTime, status: 'done' });
    } else if (order.status !== 'cancelled' && order.status !== 'pending') {
      timeline.push({ title: '待验收', time: '', status: 'pending' });
    }
    return timeline;
  };

  const handleSubmit = () => {
    Taro.showModal({
      title: '确认提交',
      content: '确定要提交此订货单给供应商吗？',
      success: (res) => {
        if (res.confirm) {
          updateOrder(orderId, {
            status: 'submitted',
            submitTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          });
          Taro.showToast({ title: '提交成功', icon: 'success' });
        }
      },
    });
  };

  const handleCancel = () => {
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消此订货单吗？',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          updateOrder(orderId, { status: 'cancelled' });
          Taro.showToast({ title: '已取消', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      },
    });
  };

  const handleReceive = () => {
    Taro.navigateTo({
      url: `/pages/receive-detail/index?orderId=${orderId}`,
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

  const statusInfo = statusMap[order.status];
  const timeline = getTimeline();

  const renderBottomBar = () => {
    switch (order.status) {
      case 'pending':
        return (
          <View className={styles.bottomBar}>
            <View className={styles.dangerBtn} onClick={handleCancel}>
              取消
            </View>
            <View className={styles.primaryBtn} onClick={handleSubmit}>
              提交订货单
            </View>
          </View>
        );
      case 'submitted':
      case 'shipped':
        return (
          <View className={styles.bottomBar}>
            <View className={styles.secondaryBtn} onClick={handleCancel}>
              取消订单
            </View>
            <View className={styles.primaryBtn} onClick={handleReceive}>
              确认收货
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.statusHeader}>
        <Text className={styles.statusText}>{statusInfo.text}</Text>
        <Text className={styles.orderNo}>
          订单号：{order.orderNo}
          {order.urgency === 'urgent' && <Text className={styles.urgentTag}>急用</Text>}
        </Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 200rpx)' }}>
        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>供应商</Text>
            <Text className={styles.infoValue}>{order.supplierName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>所属科室</Text>
            <Text className={styles.infoValue}>{order.department || '全科室'}</Text>
          </View>
          {order.chairNo && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>椅位</Text>
              <Text className={styles.infoValue}>{order.chairNo}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计到货</Text>
            <Text className={styles.infoValue}>
              {order.expectedDate || '下单后2-3天'}
            </Text>
          </View>
          {order.remark && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>备注</Text>
              <Text className={styles.infoValue}>{order.remark}</Text>
            </View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📦</Text>
              商品清单
            </Text>
            <Text className={styles.itemCount}>共 {order.items.length} 项</Text>
          </View>

          {order.items.map((item) => (
            <View key={item.productId} className={styles.orderItem}>
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{item.product.name}</Text>
                <Text className={styles.itemSpec}>{item.product.spec}</Text>
                <Text className={styles.itemBrand}>{item.product.brand}</Text>
              </View>
              <View className={styles.itemRight}>
                <Text className={styles.itemQty}>× {item.quantity}</Text>
                <Text className={styles.itemPrice}>¥{item.subtotal.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          <View className={styles.totalSection}>
            <Text className={styles.totalLabel}>
              合计（{order.totalQuantity} {order.items[0]?.product.unit || '件'}）
            </Text>
            <Text className={styles.totalAmount}>¥{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🕐</Text>
              订单进度
            </Text>
          </View>
          <View className={styles.timeline}>
            {timeline.map((item, index) => (
              <View key={index} className={styles.timelineItem}>
                <View className={classnames(styles.timelineDot, styles[item.status])} />
                <View className={styles.timelineLine} />
                <View className={styles.timelineContent}>
                  <Text className={classnames(styles.timelineTitle, item.status === 'pending' && styles.pending)}>
                    {item.title}
                  </Text>
                  {item.time && (
                    <Text className={styles.timelineTime}>{item.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: '40rpx' }} />
      </ScrollView>

      {renderBottomBar()}
    </View>
  );
};

export default OrderDetailPage;
