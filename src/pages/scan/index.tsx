import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getProductByBarcode } from '@/data/product';
import { getInventoryByBarcode, getInventoryByProductId } from '@/data/inventory';
import { Product, InventoryItem } from '@/types';

const ScanPage: React.FC = () => {
  const router = useRouter();
  const mode = (router.params.mode as string) || 'inventory';
  const productId = router.params.productId;

  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (productId) {
      const inv = getInventoryByBarcode(barcode) || getInventoryByProductId(productId);
      if (inv) {
        setScannedProduct(inv.product);
        setInventory(inv);
        setHasSearched(true);
      }
    }
  }, [productId]);

  const handleSearch = () => {
    if (!barcode.trim()) {
      Taro.showToast({ title: '请输入条码', icon: 'none' });
      return;
    }

    const product = getProductByBarcode(barcode.trim());
    const inv = getInventoryByBarcode(barcode.trim());

    setScannedProduct(product || null);
    setInventory(inv || null);
    setHasSearched(true);

    if (product) {
      Taro.vibrateShort({ type: 'medium' });
    }
  };

  const getInventoryStatus = () => {
    if (!hasSearched) return 'notfound';
    if (!scannedProduct) return 'notfound';
    return inventory?.status || 'ok';
  };

  const getStatusText = () => {
    if (!hasSearched) return '未扫描';
    if (!scannedProduct) return '未找到商品';
    switch (inventory?.status) {
      case 'ok': return '库存充足';
      case 'warning': return '库存偏低';
      case 'danger': return '库存不足';
      default: return '未知';
    }
  };

  const handleConfirmCount = () => {
    if (!scannedProduct) return;
    Taro.showToast({ title: '盘点成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const handleAddToOrder = () => {
    if (!scannedProduct) return;
    Taro.showToast({ title: '已加入订货单', icon: 'success' });
  };

  const handleViewDetail = () => {
    if (!scannedProduct) return;
    Taro.navigateTo({
      url: `/pages/product-detail/index?id=${scannedProduct.id}`,
    });
  };

  const quickBarcodes = [
    '6901234567001',
    '6901234567003',
    '6901234567005',
    '6901234567007',
  ];

  const handleQuickScan = (code: string) => {
    setBarcode(code);
    const product = getProductByBarcode(code);
    const inv = getInventoryByBarcode(code);
    setScannedProduct(product || null);
    setInventory(inv || null);
    setHasSearched(true);
    Taro.vibrateShort({ type: 'medium' });
  };

  const statusClass = getInventoryStatus();

  return (
    <View className={styles.page}>
      <View className={styles.scanArea}>
        <View className={styles.scanFrame}>
          <View className={styles.corner} />
          <View className={styles.scanLine} />
        </View>
        <Text className={styles.scanTip}>
          {mode === 'receive' ? '请扫描商品包装条码进行验收' : '将条码放入框内，自动识别'}
        </Text>
      </View>

      <View className={styles.resultPanel}>
        <View className={styles.inputSection}>
          <View className={styles.inputWrap}>
            <Input
              className={styles.barcodeInput}
              placeholder="输入或粘贴商品条码"
              placeholderClass={styles.placeholder}
              value={barcode}
              onInput={(e) => setBarcode(e.detail.value)}
              onConfirm={handleSearch}
              confirmType="search"
            />
            <View className={styles.searchBtn} onClick={handleSearch}>
              查询
            </View>
          </View>
          <Text style={{ fontSize: '24rpx', color: '#86909c', marginBottom: '16rpx' }}>
            快速测试条码（点击模拟扫码）：
          </Text>
          <View className={styles.quickBarcodes}>
            {quickBarcodes.map((code) => (
              <Text
                key={code}
                className={styles.barcodeTag}
                onClick={() => handleQuickScan(code)}
              >
                {code}
              </Text>
            ))}
          </View>
        </View>

        {hasSearched && scannedProduct ? (
          <>
            <View className={styles.resultHeader}>
              <Text className={styles.resultTitle}>{scannedProduct.name}</Text>
              <View className={classnames(styles.resultStatus, styles[statusClass])}>
                {getStatusText()}
              </View>
            </View>

            <View className={styles.productInfo}>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>规格</Text>
                <Text className={styles.infoValue}>{scannedProduct.spec}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>品牌</Text>
                <Text className={styles.infoValue}>{scannedProduct.brand}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>条码</Text>
                <Text className={styles.infoValue}>{scannedProduct.barcode}</Text>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>供应商</Text>
                <Text className={styles.infoValue}>{scannedProduct.supplierName}</Text>
              </View>
            </View>

            {inventory && (
              <View className={styles.stockSection}>
                <Text className={styles.sectionTitle}>库存信息</Text>
                <View className={styles.stockGrid}>
                  <View className={styles.stockItem}>
                    <Text className={classnames(styles.stockValue, styles[inventory.status])}>
                      {inventory.quantity}
                    </Text>
                    <Text className={styles.stockLabel}>当前库存({inventory.product.unit})</Text>
                  </View>
                  <View className={styles.stockItem}>
                    <Text className={styles.stockValue}>{inventory.consumptionRate}</Text>
                    <Text className={styles.stockLabel}>日消耗量</Text>
                  </View>
                  <View className={styles.stockItem}>
                    <Text className={styles.stockValue}>{inventory.daysRemaining}</Text>
                    <Text className={styles.stockLabel}>可使用天数</Text>
                  </View>
                </View>
              </View>
            )}

            <View className={styles.actionRow}>
              {mode === 'inventory' ? (
                <>
                  <View
                    className={classnames(styles.actionBtn, styles.secondary)}
                    onClick={handleViewDetail}
                  >
                    <Text className={styles.actionIcon}>📋</Text>
                    查看详情
                  </View>
                  <View
                    className={classnames(styles.actionBtn, styles.primary)}
                    onClick={handleConfirmCount}
                  >
                    <Text className={styles.actionIcon}>✓</Text>
                    确认盘点
                  </View>
                </>
              ) : (
                <>
                  <View
                    className={classnames(styles.actionBtn, styles.secondary)}
                    onClick={handleAddToOrder}
                  >
                    <Text className={styles.actionIcon}>📦</Text>
                    加入订货单
                  </View>
                  <View
                    className={classnames(styles.actionBtn, styles.primary)}
                    onClick={handleConfirmCount}
                  >
                    <Text className={styles.actionIcon}>✓</Text>
                    确认收货
                  </View>
                </>
              )}
            </View>
          </>
        ) : hasSearched && !scannedProduct ? (
          <View className={styles.emptyResult}>
            <Text className={styles.emptyIcon}>❓</Text>
            <Text className={styles.emptyText}>未找到该条码对应的商品</Text>
          </View>
        ) : (
          <View className={styles.emptyResult}>
            <Text className={styles.emptyIcon}>📷</Text>
            <Text className={styles.emptyText}>扫描条码或输入查询</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScanPage;
