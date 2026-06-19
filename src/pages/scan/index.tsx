import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getProductByBarcode } from '@/data/product';
import { getInventoryByBarcode, getInventoryByProductId } from '@/data/inventory';
import { Product, InventoryItem, ReceiveItem } from '@/types';
import { useAppState } from '@/store/app-context';

interface ScanCheckResult {
  inOrder: boolean;
  orderItemId?: string;
  orderQty?: number;
  currentReceivedQty?: number;
  matchStatus: 'match' | 'wrong' | 'shortage' | 'expiring';
}

const ScanPage: React.FC = () => {
  const router = useRouter();
  const mode = (router.params.mode as string) || 'inventory';
  const productId = router.params.productId;
  const orderId = router.params.orderId as string;

  const {
    orders,
    currentReceiveSession,
    incrementReceiveQty,
    updateReceiveSessionItem,
    addWrongItemToSession,
  } = useAppState();

  const currentOrder = useMemo(() => {
    if (!orderId || mode !== 'receive') return null;
    return orders.find(o => o.id === orderId) || null;
  }, [orders, orderId, mode]);

  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanCheckResult, setScanCheckResult] = useState<ScanCheckResult | null>(null);

  const getCurrentReceivedQty = (productId: string): number => {
    if (!currentReceiveSession) return 0;
    const item = currentReceiveSession.items.find(i => i.productId === productId);
    return item?.receivedQty || 0;
  };

  const scanAndProcess = (code: string) => {
    const product = getProductByBarcode(code.trim());
    const inv = getInventoryByBarcode(code.trim());

    setScannedProduct(product || null);
    setInventory(inv || null);
    setHasSearched(true);

    if (product) {
      Taro.vibrateShort({ type: 'medium' });

      if (mode === 'receive' && currentReceiveSession) {
        const orderItem = currentReceiveSession.items.find(i => i.productId === product.id);

        if (orderItem) {
          incrementReceiveQty(product.id, 1);
          const newQty = getCurrentReceivedQty(product.id) + 1;

          let matchStatus: ScanCheckResult['matchStatus'] = 'match';
          if (newQty < orderItem.expectedQty) {
            if (orderItem.status === 'expiring') matchStatus = 'expiring';
            else if (orderItem.status === 'shortage') matchStatus = 'shortage';
          }

          setScanCheckResult({
            inOrder: true,
            orderItemId: product.id,
            orderQty: orderItem.expectedQty,
            currentReceivedQty: newQty,
            matchStatus,
          });

          Taro.showToast({
            title: `已登记 +1，累计 ${newQty}`,
            icon: 'none',
            duration: 1500,
          });
        } else {
          const wrongItem: ReceiveItem = {
            productId: product.id,
            product: product,
            expectedQty: 0,
            receivedQty: 1,
            status: 'wrong',
          };
          addWrongItemToSession(wrongItem);

          Taro.showModal({
            title: '⚠️ 错发提醒',
            content: `商品「${product.name}」不在订货单中，已作为异常项登记到验收清单！`,
            showCancel: false,
            confirmText: '知道了',
          });

          setScanCheckResult({
            inOrder: false,
            matchStatus: 'wrong',
          });
        }
      }
    } else {
      setScanCheckResult(null);
    }
  };

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
    scanAndProcess(barcode.trim());
  };

  const getInventoryStatus = () => {
    if (!hasSearched) return 'notfound';
    if (!scannedProduct) return 'notfound';
    return inventory?.status || 'ok';
  };

  const getStatusText = () => {
    if (!hasSearched) return '未扫描';
    if (!scannedProduct) return '未找到商品';
    if (mode === 'receive' && scanCheckResult) {
      if (!scanCheckResult.inOrder) return '错发商品';
      if (scanCheckResult.matchStatus === 'expiring') return '已标记临期';
      if (scanCheckResult.matchStatus === 'shortage') return '已标记缺货';
      return '订单匹配';
    }
    switch (inventory?.status) {
      case 'ok': return '库存充足';
      case 'warning': return '库存偏低';
      case 'danger': return '库存不足';
      default: return '未知';
    }
  };

  const handleConfirmCount = () => {
    if (!scannedProduct) return;

    if (mode === 'receive') {
      Taro.showToast({ title: '已登记到验收清单', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 800);
      return;
    }

    Taro.showToast({ title: '盘点成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const handleMarkShortage = () => {
    if (!scannedProduct || mode !== 'receive') return;

    updateReceiveSessionItem(scannedProduct.id, {
      status: 'shortage',
    });

    if (scanCheckResult) {
      setScanCheckResult({
        ...scanCheckResult,
        matchStatus: 'shortage',
      });
    }

    Taro.showToast({ title: '已标记缺货', icon: 'none' });
  };

  const handleMarkExpiring = () => {
    if (!scannedProduct || mode !== 'receive') return;

    updateReceiveSessionItem(scannedProduct.id, {
      status: 'expiring',
    });

    if (scanCheckResult) {
      setScanCheckResult({
        ...scanCheckResult,
        matchStatus: 'expiring',
      });
    }

    Taro.showToast({ title: '已标记临期', icon: 'none' });
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
    scanAndProcess(code);
  };

  const statusClass = mode === 'receive' && scanCheckResult
    ? (scanCheckResult.inOrder
        ? (scanCheckResult.matchStatus === 'expiring' ? 'warning' : scanCheckResult.matchStatus === 'shortage' ? 'danger' : 'ok')
        : 'danger')
    : getInventoryStatus();

  const sessionItem = useMemo(() => {
    if (!currentReceiveSession || !scannedProduct) return null;
    return currentReceiveSession.items.find(i => i.productId === scannedProduct.id)
      || currentReceiveSession.wrongItems.find(i => i.productId === scannedProduct.id);
  }, [currentReceiveSession, scannedProduct]);

  return (
    <View className={styles.page}>
      <View className={styles.scanArea}>
        <View className={styles.scanFrame}>
          <View className={styles.corner} />
          <View className={styles.scanLine} />
        </View>
        <Text className={styles.scanTip}>
          {mode === 'receive'
            ? (currentOrder ? `正在核对订货单 ${currentOrder.orderNo}` : '请扫描商品包装条码进行验收')
            : '将条码放入框内，自动识别'}
        </Text>
        {mode === 'receive' && currentReceiveSession && (
          <View className={styles.sessionHint}>
            已登记 {currentReceiveSession.items.filter(i => i.receivedQty > 0).length + currentReceiveSession.wrongItems.length} 项
          </View>
        )}
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

            {mode === 'receive' && scanCheckResult && !scanCheckResult.inOrder && (
              <View className={styles.wrongShipmentWarning}>
                <Text className={styles.warningIcon}>⚠️</Text>
                <View className={styles.warningContent}>
                  <Text className={styles.warningTitle}>错发商品已登记</Text>
                  <Text className={styles.warningText}>
                    此商品不在当前订货单中，已作为异常项添加到验收清单
                  </Text>
                </View>
              </View>
            )}

            {mode === 'receive' && scanCheckResult && scanCheckResult.inOrder && (
              <View className={styles.orderMatchInfo}>
                <Text className={styles.matchIcon}>✅</Text>
                <View className={styles.matchContent}>
                  <Text className={styles.matchText}>
                    订单匹配 · 订货：{scanCheckResult.orderQty} {scannedProduct.unit}
                  </Text>
                  {sessionItem && (
                    <Text className={styles.receivedQtyText}>
                      已验收：<Text className={styles.highlight}>{sessionItem.receivedQty}</Text> {scannedProduct.unit}
                    </Text>
                  )}
                </View>
              </View>
            )}

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

            {mode === 'receive' && scanCheckResult?.inOrder && (
              <View className={styles.receiveActions}>
                <View
                  className={classnames(
                    styles.abnormalTag,
                    styles.shortage,
                    sessionItem?.status === 'shortage' && styles.active
                  )}
                  onClick={handleMarkShortage}
                >
                  <Text className={styles.tagIcon}>📉</Text>
                  标记缺货
                </View>
                <View
                  className={classnames(
                    styles.abnormalTag,
                    styles.expiring,
                    sessionItem?.status === 'expiring' && styles.active
                  )}
                  onClick={handleMarkExpiring}
                >
                  <Text className={styles.tagIcon}>⏰</Text>
                  标记临期
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
                <View
                  className={classnames(styles.actionBtn, styles.primary)}
                  style={{ flex: 1 }}
                  onClick={handleConfirmCount}
                >
                  <Text className={styles.actionIcon}>✓</Text>
                  完成并返回
                </View>
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
