import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { InventoryItem } from '@/types';

interface InventoryCardProps {
  item: InventoryItem;
  showScanBtn?: boolean;
  onClick?: () => void;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item, showScanBtn = false, onClick }) => {
  const { product, quantity, consumptionRate, daysRemaining, status } = item;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/product-detail/index?id=${product.id}`,
      });
    }
  };

  const handleScan = (e) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/scan/index?productId=${product.id}`,
    });
  };

  return (
    <View className={classnames(styles.card, styles[status])} onClick={handleCardClick}>
      <View className={styles.header}>
        <View className={styles.nameWrap}>
          <Text className={styles.name}>{product.name}</Text>
          <View className={classnames(styles.statusBadge, styles[status])}>
            <Text className={styles.statusText}>
              {status === 'ok' ? '充足' : status === 'warning' ? '偏低' : '缺货'}
            </Text>
          </View>
        </View>
        <Text className={styles.spec}>{product.spec}</Text>
      </View>

      <View className={styles.body}>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>当前库存</Text>
          <Text className={classnames(styles.infoValue, styles[status])}>
            {quantity}
            <Text className={styles.unit}> {product.unit}</Text>
          </Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>日消耗量</Text>
          <Text className={styles.infoValue}>
            {consumptionRate}
            <Text className={styles.unit}> {product.unit}/天</Text>
          </Text>
        </View>
        <View className={styles.infoItem}>
          <Text className={styles.infoLabel}>可使用</Text>
          <Text className={styles.infoValue}>
            {daysRemaining}
            <Text className={styles.unit}> 天</Text>
          </Text>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.meta}>
          <Text className={styles.brand}>{product.brand}</Text>
          <Text className={styles.supplier}>{product.supplierName}</Text>
        </View>
        {showScanBtn && (
          <View className={styles.scanBtn} onClick={handleScan}>
            <Text className={styles.scanBtnText}>扫码盘点</Text>
          </View>
        )}
      </View>

      {status === 'danger' && (
        <View className={styles.warnBar}>
          <Text className={styles.warnText}>低于安全线，建议立即补货</Text>
        </View>
      )}
    </View>
  );
};

export default InventoryCard;
