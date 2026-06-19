import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  extra?: React.ReactNode;
  showMore?: boolean;
  onMoreClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  extra,
  showMore = false,
  onMoreClick,
}) => {
  return (
    <View className={styles.wrap}>
      <View className={styles.left}>
        <View className={styles.dot} />
        <Text className={styles.title}>{title}</Text>
      </View>
      <View className={styles.right}>
        {extra}
        {showMore && (
          <Text className={styles.more} onClick={onMoreClick}>
            查看全部
          </Text>
        )}
      </View>
    </View>
  );
};

export default SectionHeader;
