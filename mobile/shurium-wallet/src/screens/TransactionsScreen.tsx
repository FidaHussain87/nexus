/**
 * SHURIUM Mobile Wallet - Transactions Screen
 * Premium glassmorphism design for transaction history
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore } from '../store/wallet';
import { colors, gradients, spacing, radius, shadows, typography } from '../theme';
import { GlassCard, PulsingDot } from '../components/ui';
import type { Transaction, TransactionType } from '../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type FilterType = 'all' | TransactionType;

const FILTERS: { type: FilterType; label: string; icon: string; gradient: string[] }[] = [
  { type: 'all', label: 'All', icon: '📋', gradient: gradients.primary },
  { type: 'send', label: 'Sent', icon: '↑', gradient: ['#EF4444', '#DC2626'] },
  { type: 'receive', label: 'Received', icon: '↓', gradient: ['#10B981', '#059669'] },
  { type: 'stake', label: 'Staking', icon: '💎', gradient: ['#3B82F6', '#2563EB'] },
  { type: 'ubi_claim', label: 'UBI', icon: '🎁', gradient: ['#A855F7', '#7C3AED'] },
];

const TX_CONFIG = {
  send: { icon: '↑', gradient: ['#EF4444', '#DC2626'], prefix: '-' },
  receive: { icon: '↓', gradient: ['#10B981', '#059669'], prefix: '+' },
  stake: { icon: '💎', gradient: ['#3B82F6', '#2563EB'], prefix: '-' },
  unstake: { icon: '⬆️', gradient: ['#F59E0B', '#D97706'], prefix: '+' },
  ubi_claim: { icon: '🎁', gradient: ['#A855F7', '#7C3AED'], prefix: '+' },
};

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { transactions, isLoadingTransactions, refreshTransactions } = useWalletStore();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTransactions(100);
    setRefreshing(false);
  }, [refreshTransactions]);

  const filteredTransactions = transactions.filter(tx => 
    activeFilter === 'all' || tx.type === activeFilter
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTxConfig = (type: string) => {
    return TX_CONFIG[type as keyof typeof TX_CONFIG] || TX_CONFIG.send;
  };

  const renderTransaction = ({ item: tx, index }: { item: Transaction; index: number }) => {
    const config = getTxConfig(tx.type);
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
      >
        <Pressable
          onPress={() => navigation.navigate('TransactionDetail', { txid: tx.txid })}
        >
          <GlassCard style={styles.transactionItem} intensity="light">
            <View style={styles.txIconContainer}>
              <LinearGradient
                colors={config.gradient}
                style={styles.txIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.txIcon}>{config.icon}</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.txDetails}>
              <Text style={styles.txType}>
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1).replace('_', ' ')}
              </Text>
              <Text style={styles.txTime}>{formatDate(tx.timestamp)}</Text>
              {tx.memo && (
                <Text style={styles.txMemo} numberOfLines={1}>{tx.memo}</Text>
              )}
            </View>
            
            <View style={styles.txAmountContainer}>
              <Text style={[styles.txAmount, { color: config.gradient[0] }]}>
                {config.prefix}{parseFloat(tx.amount).toFixed(4)}
              </Text>
              <Text style={styles.txCurrency}>SHR</Text>
              <View style={styles.txStatusContainer}>
                <View style={[
                  styles.txStatusDot,
                  { backgroundColor: tx.status === 'confirmed' ? colors.success.base : 
                                    tx.status === 'pending' ? colors.warning.base : colors.error.base }
                ]} />
                <Text style={[
                  styles.txStatus,
                  { color: tx.status === 'confirmed' ? colors.success.base : 
                           tx.status === 'pending' ? colors.warning.base : colors.error.base }
                ]}>
                  {tx.status === 'confirmed' 
                    ? `${tx.confirmations} conf`
                    : tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <GlassCard style={styles.emptyState} intensity="light">
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        {activeFilter === 'all' 
          ? 'No transactions yet'
          : `No ${activeFilter.replace('_', ' ')} transactions`}
      </Text>
      <Text style={styles.emptySubtext}>
        Your transaction history will appear here
      </Text>
    </GlassCard>
  );

  const renderFilterItem = ({ item }: { item: typeof FILTERS[0] }) => (
    <Pressable
      style={styles.filterButtonContainer}
      onPress={() => setActiveFilter(item.type)}
    >
      {activeFilter === item.type ? (
        <LinearGradient
          colors={item.gradient}
          style={styles.filterButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.filterIcon}>{item.icon}</Text>
          <Text style={styles.filterTextActive}>{item.label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.filterButtonInactive}>
          <Text style={styles.filterIcon}>{item.icon}</Text>
          <Text style={styles.filterText}>{item.label}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundOrbs}>
        <Animated.View style={[styles.orb, styles.orb1, { opacity: fadeAnim }]} />
        <Animated.View style={[styles.orb, styles.orb2, { opacity: fadeAnim }]} />
      </View>

      {/* Filter Tabs */}
      <GlassCard style={styles.filterContainer} intensity="medium">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.type}
          showsHorizontalScrollIndicator={false}
          renderItem={renderFilterItem}
          contentContainerStyle={styles.filterList}
        />
      </GlassCard>

      {/* Transaction Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Transaction List */}
      {isLoadingTransactions && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <PulsingDot color={colors.primary.start} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.txid}
          renderItem={renderTransaction}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.primary.start}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredTransactions.length === 0 && styles.emptyContainer
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backgroundOrbs: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 250,
    height: 250,
    top: -50,
    right: -80,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  orb2: {
    width: 180,
    height: 180,
    bottom: 150,
    left: -60,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  filterContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  filterList: {
    paddingHorizontal: spacing.xs,
  },
  filterButtonContainer: {
    marginHorizontal: spacing.xs,
    overflow: 'hidden',
    borderRadius: radius.full,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  filterButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.glass.light,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  filterText: {
    color: colors.text.tertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  countContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  countText: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txIconContainer: {
    marginRight: spacing.md,
  },
  txIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  txIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  txDetails: {
    flex: 1,
  },
  txType: {
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  txTime: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  txMemo: {
    color: colors.text.tertiary,
    fontSize: typography.small.fontSize,
    marginTop: 2,
    fontStyle: 'italic',
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  txCurrency: {
    color: colors.text.muted,
    fontSize: typography.small.fontSize,
    marginTop: 2,
  },
  txStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  txStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  txStatus: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.text.tertiary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.tertiary,
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
  },
});

export default TransactionsScreen;
