import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getProductById } from '@/data/product';
import { getInventoryByProductId } from '@/data/inventory';
import { getSupplierById } from '@/data/supplier';
import { Product, InventoryItem, Supplier } from '@/types';

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const productId = router.params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (productId) {
      const p = getProductById(productId);
      const inv = getInventoryByProductId(productId);
      if (p) {
        setProduct(p);
        const s = getSupplierById(p.supplierId);
        setSupplier(s || null);
      }
      if (inv) {
        setInventory(inv);
      }
    }
  }, [productId]);

  const handleAddToOrder = () => {
    Taro.showToast({ title: '已加入订货单', icon: 'success' });
  };

  const handleScanCount = () => {
    Taro.navigateTo({
      url: `/pages/scan/index?productId=${productId}`,
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok': return '库存充足';
      case 'warning': return '库存偏低';
      case 'danger': return '库存不足';
      default: return '未知';
    }
  };

  const calculateProgress = () => {
    if (!inventory || !product) return 0;
    const max = product.warnStock * 2;
    return Math.min(100, (inventory.quantity / max) * 100);
  };

  if (!product) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '200rpx 0', textAlign: 'center' }}>
          <Text style={{ fontSize: '120rpx', opacity: 0.3 }}>❓</Text>
          <Text style={{ fontSize: '28rpx', color: '#86909c', marginTop: '24rpx' }}>
            商品不存在
          </Text>
        </View>
      </View>
    );
  }

  const status = inventory?.status || 'ok';
  const progress = calculateProgress();

  return (
    <View className={styles.page}>
      <ScrollView scrollY style={{ height: 'calc(100vh - 140rpx)' }}>
        <View className={styles.productHeader}>
          <Text className={styles.productName}>{product.name}</Text>
          <Text className={styles.productSpec}>{product.spec}</Text>
          <View className={styles.statusRow}>
            <View className={classnames(styles.statusBadge, styles[status])}>
              {getStatusText(status)}
            </View>
            <View className={styles.categoryTag}>{product.category}</View>
          </View>
        </View>

        <View className={styles.stockCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📊</Text>
            库存状态
          </Text>

          <View className={styles.stockGrid}>
            <View className={styles.stockItem}>
              <Text className={classnames(styles.stockNumber, styles[status])}>
                {inventory?.quantity || 0}
              </Text>
              <Text className={styles.stockUnit}>{product.unit}</Text>
              <Text className={styles.stockLabel}>当前库存</Text>
            </View>
            <View className={styles.stockItem}>
              <Text className={styles.stockNumber}>
                {inventory?.consumptionRate || 0}
              </Text>
              <Text className={styles.stockUnit}>{product.unit}/天</Text>
              <Text className={styles.stockLabel}>日均消耗</Text>
            </View>
            <View className={styles.stockItem}>
              <Text className={styles.stockNumber}>
                {inventory?.daysRemaining || 0}
              </Text>
              <Text className={styles.stockUnit}>天</Text>
              <Text className={styles.stockLabel}>可使用</Text>
            </View>
          </View>

          <View className={styles.progressBar}>
            <View
              className={classnames(styles.progressFill, styles[status])}
              style={{ width: `${progress}%` }}
            />
          </View>
          <View className={styles.safetyLine}>
            <Text>安全线：{product.safetyStock} {product.unit}</Text>
            <Text>预警线：{product.warnStock} {product.unit}</Text>
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.infoCardHeader}>
            <Text className={styles.infoCardTitle}>
              <Text className={styles.cardTitleIcon}>🏢</Text>
              供应商信息
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>供应商</Text>
            <Text className={styles.infoValue}>{product.supplierName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>单价</Text>
            <Text className={classnames(styles.infoValue, styles.priceValue)}>
              ¥{product.price.toFixed(2)} / {product.unit}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计到货</Text>
            <Text className={styles.infoValue}>
              下单后 {supplier?.deliveryDays || 2} 天
            </Text>
          </View>
          {supplier && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{supplier.phone}</Text>
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <View className={styles.infoCardHeader}>
            <Text className={styles.infoCardTitle}>
              <Text className={styles.cardTitleIcon}>📋</Text>
              商品信息
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>品牌</Text>
            <Text className={styles.infoValue}>{product.brand}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>条码</Text>
            <Text className={styles.infoValue}>{product.barcode}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>规格</Text>
            <Text className={styles.infoValue}>{product.spec}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>所属科室</Text>
            <Text className={styles.infoValue}>{inventory?.department || '-'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>椅位</Text>
            <Text className={styles.infoValue}>{inventory?.chairNo || '-'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>上次盘点</Text>
            <Text className={styles.infoValue}>
              {inventory?.lastCountDate || '-'}
            </Text>
          </View>
        </View>

        <View style={{ height: '40rpx' }} />
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.secondaryBtn} onClick={handleScanCount}>
          <Text className={styles.btnIcon}>📷</Text>
          扫码盘点
        </View>
        <View className={styles.primaryBtn} onClick={handleAddToOrder}>
          <Text className={styles.btnIcon}>🛒</Text>
          加入订货单
        </View>
      </View>
    </View>
  );
};

export default ProductDetailPage;
