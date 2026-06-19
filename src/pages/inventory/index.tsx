import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatCard from '@/components/StatCard';
import InventoryCard from '@/components/InventoryCard';
import SectionHeader from '@/components/SectionHeader';
import { inventoryList, getInventoryStats } from '@/data/inventory';
import { categories } from '@/data/product';
import { InventoryItem } from '@/types';

const InventoryPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = getInventoryStats();

  const today = useMemo(() => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekDays[date.getDay()]}`;
  }, []);

  const filteredInventory = useMemo(() => {
    let list: InventoryItem[] = [...inventoryList];

    if (activeCategory !== 'all') {
      list = list.filter((item) => item.product.category === activeCategory);
    }

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.product.name.toLowerCase().includes(keyword) ||
          item.product.brand.toLowerCase().includes(keyword) ||
          item.product.barcode.includes(keyword)
      );
    }

    list.sort((a, b) => {
      const order = { danger: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    return list;
  }, [searchText, activeCategory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  };

  const handleScan = () => {
    Taro.navigateTo({ url: '/pages/scan/index' });
  };

  const handleCreateOrder = () => {
    Taro.navigateTo({ url: '/pages/create-order/index' });
  };

  const handleReceive = () => {
    Taro.switchTab({ url: '/pages/receive/index' });
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={isRefreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>早上好，护士长</Text>
        <Text className={styles.title}>今日库存概览</Text>
        <Text className={styles.date}>{today}</Text>
      </View>

      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索耗材名称、品牌或条码"
          placeholderClass={styles.placeholder}
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          confirmType="search"
        />
      </View>

      <View className={styles.statSection}>
        <ScrollView scrollX className={styles.statRow} enhanced showScrollbar={false}>
          <View className={styles.statItem}>
            <StatCard title="全部品类" value={stats.total} unit="种" type="primary" />
          </View>
          <View className={styles.statItem}>
            <StatCard title="库存充足" value={stats.ok} unit="种" type="success" />
          </View>
          <View className={styles.statItem}>
            <StatCard title="库存偏低" value={stats.warning} unit="种" type="warning" />
          </View>
          <View className={styles.statItem}>
            <StatCard title="缺货预警" value={stats.danger} unit="种" type="danger" />
          </View>
        </ScrollView>
      </View>

      <View className={styles.quickActions}>
        <View className={styles.actionGrid}>
          <View className={styles.actionCard} onClick={handleScan}>
            <View className={classnames(styles.actionIcon, styles.scan)}>📷</View>
            <Text className={styles.actionText}>扫码盘点</Text>
          </View>
          <View className={styles.actionCard} onClick={handleCreateOrder}>
            <View className={classnames(styles.actionIcon, styles.order)}>📋</View>
            <Text className={styles.actionText}>生成订货单</Text>
          </View>
          <View className={styles.actionCard} onClick={handleReceive}>
            <View className={classnames(styles.actionIcon, styles.receive)}>📦</View>
            <Text className={styles.actionText}>到货验收</Text>
          </View>
        </View>
      </View>

      <View className={styles.categorySection}>
        <ScrollView scrollX className={styles.categoryScroll} enhanced showScrollbar={false}>
          {categories.map((cat) => (
            <Text
              key={cat.id}
              className={classnames(styles.categoryItem, activeCategory === cat.id && styles.active)}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionTitle}>
          <Text className={styles.sectionTitleText}>库存清单</Text>
          <Text className={styles.sectionCount}>共 {filteredInventory.length} 项</Text>
        </View>

        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <InventoryCard key={item.id} item={item} showScanBtn />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无匹配的耗材</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default InventoryPage;
