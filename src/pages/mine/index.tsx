import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

interface MenuItem {
  icon: string;
  iconClass: string;
  title: string;
  desc?: string;
  badge?: number;
  path?: string;
  onClick?: () => void;
}

const MinePage: React.FC = () => {
  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: '基础管理',
      items: [
        {
          icon: '🏥',
          iconClass: 'blue',
          title: '科室与椅位',
          desc: '管理科室和治疗椅位',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
        {
          icon: '🏢',
          iconClass: 'green',
          title: '供应商管理',
          desc: '3家合作供应商',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
        {
          icon: '⭐',
          iconClass: 'orange',
          title: '常用耗材',
          desc: '设置常用补货项目',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
      ],
    },
    {
      title: '数据与记录',
      items: [
        {
          icon: '📊',
          iconClass: 'purple',
          title: '消耗统计',
          desc: '查看耗材消耗趋势',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
        {
          icon: '📝',
          iconClass: 'blue',
          title: '操作记录',
          desc: '查看盘点和验收日志',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
      ],
    },
    {
      title: '系统设置',
      items: [
        {
          icon: '🔔',
          iconClass: 'orange',
          title: '消息通知',
          desc: '库存预警、到货提醒',
          badge: 2,
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
        {
          icon: '❓',
          iconClass: 'green',
          title: '帮助中心',
          desc: '使用教程与常见问题',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
        {
          icon: '⚙️',
          iconClass: 'blue',
          title: '系统设置',
          desc: '安全、通用设置',
          onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
        },
      ],
    },
  ];

  return (
    <View className={styles.page}>
      <View className={styles.userCard}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👩‍⚕️</View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>张护士长</Text>
            <Text className={styles.userRole}>口腔科护士长</Text>
            <Text className={styles.clinicName}>康健口腔门诊部</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} className={styles.menuGroup}>
            {group.title && (
              <Text className={styles.groupTitle}>{group.title}</Text>
            )}
            {group.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                className={styles.menuItem}
                onClick={item.onClick}
              >
                <View className={classnames(styles.menuIcon, styles[item.iconClass])}>
                  {item.icon}
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                  {item.desc && (
                    <Text className={styles.menuDesc}>{item.desc}</Text>
                  )}
                </View>
                {item.badge !== undefined && item.badge > 0 && (
                  <Text className={styles.badge}>{item.badge}</Text>
                )}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className={styles.footer}>
        <Text className={styles.version}>牙科耗材管家 v1.0.0</Text>
      </View>
    </View>
  );
};

export default MinePage;
