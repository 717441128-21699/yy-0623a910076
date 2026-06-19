import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  title: string;
  value: number | string;
  type?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  unit?: string;
  subText?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type = 'default',
  unit,
  subText,
  onClick,
}) => {
  return (
    <View
      className={classnames(styles.statCard, styles[type], onClick && styles.clickable)}
      onClick={onClick}
    >
      <Text className={styles.title}>{title}</Text>
      <View className={styles.valueWrap}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {subText && <Text className={styles.subText}>{subText}</Text>}
    </View>
  );
};

export default StatCard;
