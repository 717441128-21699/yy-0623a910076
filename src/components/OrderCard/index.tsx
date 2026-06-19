import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

const statusMap = {
  pending: { text: '待提交', class: 'pending' },
  submitted: { text: '已提交', class: 'submitted' },
  shipped: { text: '配送中', class: 'shipped' },
  received: { text: '已收货', class: 'received' },
  cancelled: { text: '已取消', class: 'cancelled' },
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const status = statusMap[order.status];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`,
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
        <View className={classnames(styles.statusBadge, styles[status.class])}>
          <Text className={styles.statusText}>{status.text}</Text>
        </View>
      </View>

      <View className={styles.body}>
        <View className={styles.itemList}>
          {order.items.slice(0, 2).map((item) => (
            <Text key={item.productId} className={styles.itemName}>
              {item.product.name} x{item.quantity}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text className={styles.moreText}>等{order.items.length}项商品</Text>
          )}
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.meta}>
          <Text className={styles.supplier}>{order.supplierName}</Text>
          {order.department && (
            <Text className={styles.dept}>{order.department}</Text>
          )}
        </View>
        <View className={styles.amountWrap}>
          <Text className={styles.amountLabel}>合计</Text>
          <Text className={styles.amount}>¥{order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {order.urgency === 'urgent' && (
        <View className={styles.urgentTag}>
          <Text className={styles.urgentText}>急用</Text>
        </View>
      )}

      <View className={styles.timeRow}>
        <Text className={styles.timeText}>下单时间：{order.createTime}</Text>
      </View>
    </View>
  );
};

export default OrderCard;
